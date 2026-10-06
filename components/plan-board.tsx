'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Pencil,Check,Trash2,MapPin,X,Plus,Minus,RotateCcw} from 'lucide-react';
import {toast} from 'sonner';
import type {Unit} from '@/lib/catalog';
import {funds,fundColor,soldColor,pinId,fundFromGroup,type FundKey,type PinLayer,type UnitPin} from '@/lib/plan-funds';

type Props={
  projectId:string;image:string;layer:PinLayer;chrome?:PinLayer;units:Unit[];pins:UnitPin[];canManage:boolean;
  statusOf:(u:Unit)=>string;visibleCodes:Set<string>;onOpenUnit:(u:Unit)=>void;onSaved:()=>void;
};
type View={s:number;x:number;y:number};
const up=(s:string)=>s.trim().toUpperCase();
const MAX=8;
const num=(n:number)=>n.toLocaleString('vi-VN',{maximumFractionDigits:2});

/** Bản đồ/mặt bằng có pin mã căn: kéo để di chuyển, lăn chuột hoặc nút +/− để thu phóng. */
export default function PlanBoard({projectId,image,layer,chrome=layer,units,pins,canManage,statusOf,visibleCodes,onOpenUnit,onSaved}:Props){
  const [local,setLocal]=useState<UnitPin[]>(pins);
  const [edit,setEdit]=useState(false),[placing,setPlacing]=useState<string|null>(null),[sel,setSel]=useState<string|null>(null),[hidden,setHidden]=useState<Set<FundKey>>(new Set()),[info,setInfo]=useState<string|null>(null);
  const [view,setView]=useState<View>({s:1,x:0,y:0});const fit=useRef<View>({s:1,x:0,y:0});
  const box=useRef<HTMLDivElement>(null),img=useRef<HTMLImageElement>(null);
  const drag=useRef<string|null>(null),pan=useRef<{x:number;y:number;vx:number;vy:number;moved:boolean}|null>(null),moved=useRef(false);
  useEffect(()=>setLocal(pins),[pins]);
  useEffect(()=>{setInfo(null);if(!edit){setPlacing(null);setSel(null);}},[edit]);

  const unitByCode=useMemo(()=>{const m=new Map<string,Unit>();units.forEach(u=>m.set(up(u.code),u));return m;},[units]);
  const pinByCode=useMemo(()=>{const m=new Map<string,UnitPin>();local.forEach(p=>m.set(up(p.code),p));return m;},[local]);
  const unplaced=useMemo(()=>units.filter(u=>!pinByCode.has(up(u.code))),[units,pinByCode]);

  /* Khung nhìn: bản đồ phủ kín khung, mặt bằng vừa khung. */
  function reset(){const b=box.current,i=img.current;if(!b||!i||!i.naturalWidth)return;const bw=b.clientWidth,bh=b.clientHeight,ih=bw*i.naturalHeight/i.naturalWidth;
    const s=layer==='map'?Math.max(1,bh/ih):Math.min(1,bh/ih);const v={s,x:(bw-bw*s)/2,y:(bh-ih*s)/2};fit.current=v;setView(v);}
  useEffect(()=>{const b=box.current;if(!b)return;const ro=new ResizeObserver(reset);ro.observe(b);return()=>ro.disconnect();},[image,layer]);
  const clampView=(v:View):View=>{const b=box.current,i=img.current;if(!b||!i||!i.naturalWidth)return v;const bw=b.clientWidth,bh=b.clientHeight,w=bw*v.s,h=bw*i.naturalHeight/i.naturalWidth*v.s;
    const x=w<=bw?(bw-w)/2:Math.min(0,Math.max(bw-w,v.x)),y=h<=bh?(bh-h)/2:Math.min(0,Math.max(bh-h,v.y));return {s:v.s,x,y};};
  function zoomAt(f:number,cx?:number,cy?:number){const b=box.current;if(!b)return;const px=cx??b.clientWidth/2,py=cy??b.clientHeight/2;
    setView(v=>{const s=Math.max(fit.current.s,Math.min(MAX,v.s*f));return clampView({s,x:px-(px-v.x)*s/v.s,y:py-(py-v.y)*s/v.s});});}
  useEffect(()=>{const b=box.current;if(!b)return;const onWheel=(e:WheelEvent)=>{e.preventDefault();const r=b.getBoundingClientRect();zoomAt(e.deltaY<0?1.15:1/1.15,e.clientX-r.left,e.clientY-r.top);};b.addEventListener('wheel',onWheel,{passive:false});return()=>b.removeEventListener('wheel',onWheel);});

  async function send(body:object,fail:string){try{const r=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d:any=await r.json();if(!r.ok)throw Error(d.error||fail);}catch(e){toast.error(e instanceof Error?e.message:fail);}onSaved();}
  function persist(pin:UnitPin){setLocal(prev=>[...prev.filter(p=>up(p.code)!==up(pin.code)),pin]);send({action:'save',kind:'pin',id:pinId(projectId,pin.code,layer),data:pin},'Không lưu được pin.');}
  function remove(code:string){setLocal(prev=>prev.filter(p=>up(p.code)!==up(code)));setSel(null);send({action:'delete',kind:'pin',id:pinId(projectId,code,layer)},'Không gỡ được pin.');}
  const coords=(cx:number,cy:number)=>{const r=img.current?.getBoundingClientRect();if(!r||!r.width)return null;return {x:Math.max(0,Math.min(100,(cx-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(cy-r.top)/r.height*100))};};

  function down(e:React.PointerEvent){if(e.button!==0)return;pan.current={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y,moved:false};box.current?.setPointerCapture(e.pointerId);}
  function pinDown(code:string,e:React.PointerEvent){e.stopPropagation();if(!edit)return;drag.current=code;moved.current=false;box.current?.setPointerCapture(e.pointerId);}
  function move(e:React.PointerEvent){
    if(drag.current){const c=coords(e.clientX,e.clientY);if(!c)return;moved.current=true;const code=drag.current;setLocal(prev=>prev.map(p=>up(p.code)===up(code)?{...p,x:c.x,y:c.y}:p));return;}
    const p=pan.current;if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(!p.moved&&Math.hypot(dx,dy)<5)return;p.moved=true;setView(v=>clampView({s:v.s,x:p.vx+dx,y:p.vy+dy}));
  }
  function upHandler(e:React.PointerEvent){
    if(drag.current){const code=drag.current;drag.current=null;const p=pinByCode.get(up(code));if(p&&moved.current)persist(p);else setSel(s=>s===code?null:code);return;}
    const p=pan.current;pan.current=null;if(!p||p.moved)return;
    if(edit&&placing){const c=coords(e.clientX,e.clientY);if(!c)return;const u=unitByCode.get(up(placing));
      persist({projectId,code:placing,layer,x:c.x,y:c.y,fund:pinByCode.get(up(placing))?.fund||fundFromGroup(u?.group)});
      const next=unplaced.find(x=>up(x.code)!==up(placing));setPlacing(next?next.code:null);}
    else {setSel(null);setInfo(null);}
  }

  const colorOf=(p:UnitPin)=>{const u=unitByCode.get(up(p.code));return u&&statusOf(u)==='Đã bán'?soldColor:fundColor(p.fund);};
  const shown=local.filter(p=>!hidden.has(p.fund)&&(visibleCodes.has(up(p.code))||(edit&&!unitByCode.has(up(p.code)))));
  const hasSold=local.some(p=>{const u=unitByCode.get(up(p.code));return u&&statusOf(u)==='Đã bán';});
  const selPin=sel?pinByCode.get(up(sel)):undefined;
  const infoPin=!edit&&info?shown.find(p=>up(p.code)===up(info)):undefined;

  return <div className={'plan-board plan-'+chrome+(edit&&placing?' is-placing':'')}>
    <div className="plan-viewport" ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={upHandler} onPointerCancel={()=>{pan.current=null;drag.current=null;}}>
      <div className="plan-stage" style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.s})`}}>
        <img ref={img} src={image} alt={layer==='map'?'Bản đồ dự án':'Mặt bằng dự án'} draggable={false} onLoad={reset}/>
        {shown.map(p=>{const u=unitByCode.get(up(p.code));const active=sel===p.code||info===p.code;return (
          <button key={p.code} type="button" className={'plan-pin'+(active?' is-active':'')+(edit?' is-edit':'')} style={{left:`${p.x}%`,top:`${p.y}%`,transform:`translate(-50%,-100%) scale(${1/view.s})`,['--pin' as string]:colorOf(p)}}
            onPointerDown={e=>pinDown(p.code,e)} onClick={e=>{e.stopPropagation();if(!edit)setInfo(i=>i===p.code?null:p.code);}}
            aria-label={`Căn ${p.code}`}><span>{p.code}</span><svg viewBox="0 0 26 34" aria-hidden="true"><path d="M13 33C13 33 2 20 2 12a11 11 0 0 1 22 0c0 8-11 21-11 21z"/><circle cx="13" cy="12" r="4.5"/></svg></button>);})}
        {infoPin&&(()=>{const p=infoPin,u=unitByCode.get(up(p.code)),ih=img.current?.clientHeight||0,below=view.y+p.y/100*ih*view.s<330;return (
          <div className={'plan-card'+(below?' below':'')} style={{left:`${p.x}%`,top:`${p.y}%`,transform:`scale(${1/view.s}) translate(-50%,${below?'14px':'calc(-100% - 58px)'})`,['--pin' as string]:colorOf(p)}} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()}>
            <div className="plan-card-head"><strong>{p.code}</strong><button type="button" aria-label="Đóng" onClick={()=>setInfo(null)}><X size={15}/></button></div>
            {u?<><dl>
              <div><dt>Loại hình:</dt><dd>{u.type||'—'}</dd></div>
              <div><dt>DT đất:</dt><dd>{u.area?<>{num(u.area)} <sup>m²</sup></>:'—'}</dd></div>
              <div><dt>DT XD:</dt><dd>{u.builtArea?<>{num(u.builtArea)} <sup>m²</sup></>:'—'}</dd></div>
            </dl>
            <div className="plan-card-price"><span>Giá bán:<small>(Chưa VAT+KBPT)</small></span><b>{u.price?<>{num(u.price)} <sup>TỶ</sup></>:'Liên hệ'}</b></div>
            <div className="plan-card-foot"><span className={'status '+(statusOf(u)==='Còn hàng'?'available':'held')}>{statusOf(u)}</span><button type="button" onClick={()=>onOpenUnit(u)}>Xem chi tiết</button></div></>
            :<p className="plan-muted">Mã căn chưa có trong bảng hàng.</p>}
          </div>);})()}
      </div>
    </div>

    <div className="plan-legend" role="group" aria-label="Chú thích loại quỹ">
      {funds.map(f=><button key={f.key} type="button" className={'plan-legend-item'+(hidden.has(f.key)?' off':'')} onClick={()=>setHidden(h=>{const n=new Set(h);if(n.has(f.key))n.delete(f.key);else n.add(f.key);return n;})}><span className="dot" style={{background:f.color}}/>{f.label} <b>{local.filter(p=>p.fund===f.key).length}</b></button>)}
      {hasSold&&<span className="plan-legend-item static"><span className="dot" style={{background:soldColor}}/>Đã bán</span>}
      {canManage&&<button type="button" className={'plan-edit-toggle'+(edit?' on':'')} onClick={()=>setEdit(!edit)}>{edit?<><Check size={15}/>Xong</>:<><Pencil size={15}/>Ghim mã căn</>}</button>}
    </div>

    <div className="plan-zoom"><button type="button" aria-label="Phóng to" onClick={()=>zoomAt(1.4)}><Plus size={18}/></button><button type="button" aria-label="Thu nhỏ" onClick={()=>zoomAt(1/1.4)}><Minus size={18}/></button><button type="button" aria-label="Về toàn cảnh" onClick={reset}><RotateCcw size={16}/></button></div>
    {edit&&placing&&<div className="plan-hint"><MapPin size={14}/>Bấm lên {chrome==='map'&&layer==='map'?'bản đồ':'mặt bằng'} để ghim <b>{placing}</b> · Kéo để di chuyển</div>}

    {edit&&<div className="plan-editor">
      {selPin?<>
        <div className="plan-editor-head"><strong>{selPin.code}</strong><button type="button" className="icon-button" aria-label="Bỏ chọn" onClick={()=>setSel(null)}><X size={16}/></button></div>
        {(()=>{const u=unitByCode.get(up(selPin.code));return u?<p className="plan-muted">{u.type||'—'} · {u.area||0} m²{statusOf(u)==='Đã bán'?' · Đã bán':''}</p>:<p className="plan-muted">Mã căn không còn trong bảng hàng.</p>;})()}
        <div className="plan-fund-row">{funds.map(f=><button key={f.key} type="button" style={selPin.fund===f.key?{background:f.color,borderColor:f.color,color:'#fff'}:{}} onClick={()=>persist({...selPin,fund:f.key})}><span className="dot" style={{background:f.color}}/>{f.label}</button>)}</div>
        <p className="plan-muted">Kéo pin để đổi vị trí.</p>
        <button type="button" className="button subtle plan-remove" onClick={()=>remove(selPin.code)}><Trash2 size={15}/>Gỡ pin</button>
      </>:<>
        <div className="plan-editor-head"><strong>Chưa ghim ({unplaced.length})</strong></div>
        {!units.length?<p className="plan-muted">Chưa có bảng hàng để ghim.</p>:unplaced.length?<>
          <button type="button" className={'button '+(placing?'dark':'subtle')} onClick={()=>setPlacing(placing?null:unplaced[0].code)}>{placing?'Dừng ghim':'Ghim lần lượt'}</button>
          <div className="plan-code-list">{unplaced.map(u=><button key={u.id} type="button" className={'plan-code'+(placing===u.code?' cur':'')} onClick={()=>setPlacing(u.code)}><span className="m">{u.code}</span><small>{u.type||''}{u.area?` · ${u.area} m²`:''}</small></button>)}</div>
        </>:<p className="plan-muted">Tất cả mã căn đã được ghim.</p>}
        {!placing&&<p className="plan-muted">Chọn mã căn rồi bấm lên đúng lô. Bấm pin đã ghim để đổi loại quỹ hoặc gỡ.</p>}
      </>}
    </div>}
  </div>;
}
