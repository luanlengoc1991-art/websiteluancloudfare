'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Pencil,Check,Trash2,MapPin,X} from 'lucide-react';
import {toast} from 'sonner';
import type {Unit,Asset} from '@/lib/catalog';
import {funds,fundColor,fundLabel,soldColor,pinId,fundFromGroup,type FundKey,type UnitPin} from '@/lib/plan-funds';

type Props={
  projectId:string;units:Unit[];plans:Asset[];pins:UnitPin[];canManage:boolean;zoom:number;scene:number;
  statusOf:(u:Unit)=>string;visibleCodes:Set<string>;onOpenUnit:(u:Unit)=>void;onSaved:()=>void;
};
const up=(s:string)=>s.trim().toUpperCase();

export default function PlanBoard({projectId,units,plans,pins,canManage,zoom,scene,statusOf,visibleCodes,onOpenUnit,onSaved}:Props){
  const [local,setLocal]=useState<UnitPin[]>(pins);
  const [edit,setEdit]=useState(false),[placing,setPlacing]=useState<string|null>(null),[sel,setSel]=useState<string|null>(null),[hidden,setHidden]=useState<Set<FundKey>>(new Set());
  const stage=useRef<HTMLDivElement>(null);const drag=useRef<string|null>(null);const moved=useRef(false);
  useEffect(()=>setLocal(pins),[pins]);
  useEffect(()=>{if(!edit){setPlacing(null);setSel(null);}},[edit]);

  const unitByCode=useMemo(()=>{const m=new Map<string,Unit>();units.forEach(u=>m.set(up(u.code),u));return m;},[units]);
  const pinByCode=useMemo(()=>{const m=new Map<string,UnitPin>();local.forEach(p=>m.set(up(p.code),p));return m;},[local]);
  const unplaced=useMemo(()=>units.filter(u=>!pinByCode.has(up(u.code))),[units,pinByCode]);

  async function persist(pin:UnitPin){
    setLocal(prev=>{const rest=prev.filter(p=>up(p.code)!==up(pin.code));return [...rest,pin];});
    try{const r=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',kind:'pin',id:pinId(projectId,pin.code),data:pin})});const d:any=await r.json();if(!r.ok)throw Error(d.error||'Không lưu được pin.');onSaved();}
    catch(e){toast.error(e instanceof Error?e.message:'Không lưu được pin.');onSaved();}
  }
  async function remove(code:string){
    setLocal(prev=>prev.filter(p=>up(p.code)!==up(code)));setSel(null);
    try{const r=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',kind:'pin',id:pinId(projectId,code)})});const d:any=await r.json();if(!r.ok)throw Error(d.error||'Không gỡ được pin.');onSaved();}
    catch(e){toast.error(e instanceof Error?e.message:'Không gỡ được pin.');onSaved();}
  }
  const coords=(clientX:number,clientY:number)=>{const img=stage.current?.querySelector('img');if(!img)return null;const r=img.getBoundingClientRect();return {x:Math.max(0,Math.min(100,(clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(clientY-r.top)/r.height*100))};};

  function placeAt(e:React.MouseEvent){
    if(!edit||!placing)return;const c=coords(e.clientX,e.clientY);if(!c)return;
    const u=unitByCode.get(up(placing));persist({projectId,code:placing,x:c.x,y:c.y,fund:pinByCode.get(up(placing))?.fund||fundFromGroup(u?.group)});
    setSel(placing);const next=unplaced.find(u=>up(u.code)!==up(placing));setPlacing(next?next.code:null);
  }
  function onPinDown(code:string,e:React.PointerEvent){if(!edit)return;e.stopPropagation();drag.current=code;moved.current=false;stage.current?.setPointerCapture?.(e.pointerId);}
  function onMove(e:React.PointerEvent){if(!edit||!drag.current)return;const c=coords(e.clientX,e.clientY);if(!c)return;moved.current=true;setLocal(prev=>prev.map(p=>up(p.code)===up(drag.current!)?{...p,x:c.x,y:c.y}:p));}
  function onUp(){if(!drag.current)return;const code=drag.current;drag.current=null;const p=pinByCode.get(up(code));if(p&&moved.current)persist(p);}

  const colorOf=(code:string,fund:FundKey)=>{const u=unitByCode.get(up(code));return u&&statusOf(u)==='Đã bán'?soldColor:fundColor(fund);};
  const shown=local.filter(p=>!hidden.has(p.fund)&&(visibleCodes.has(up(p.code))||(edit&&!unitByCode.has(up(p.code)))));
  const counts=(k:FundKey)=>local.filter(p=>p.fund===k).length;

  return <div className="immersive-plan plan-board">
    <div className="plan-stage" ref={stage} style={{transform:`scale(${zoom})`}} onClick={placeAt} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
      <img src={plans[scene%plans.length].url} alt="Mặt bằng dự án" draggable={false}/>
      {shown.map(p=>{const u=unitByCode.get(up(p.code));const active=sel===p.code;return (
        <button key={p.code} className={'map-pin plan-pin'+(active?' is-active':'')+(edit?' is-edit':'')} style={{left:`${p.x}%`,top:`${p.y}%`,background:colorOf(p.code,p.fund)}}
          onPointerDown={e=>onPinDown(p.code,e)}
          onClick={e=>{e.stopPropagation();if(moved.current){moved.current=false;return;}if(edit)setSel(active?null:p.code);else if(u)onOpenUnit(u);}}>{p.code}</button>);})}
    </div>

    <div className="plan-legend" role="group" aria-label="Chú thích loại quỹ">
      {funds.map(f=><button key={f.key} type="button" className={'plan-legend-item'+(hidden.has(f.key)?' off':'')} onClick={()=>setHidden(h=>{const n=new Set(h);n.has(f.key)?n.delete(f.key):n.add(f.key);return n;})}><span className="dot" style={{background:f.color}}/>{f.label} <b>{counts(f.key)}</b></button>)}
      {local.some(p=>{const u=unitByCode.get(up(p.code));return u&&statusOf(u)==='Đã bán';})&&<span className="plan-legend-item static"><span className="dot" style={{background:soldColor}}/>Đã bán</span>}
      {canManage&&<button type="button" className={'plan-edit-toggle'+(edit?' on':'')} onClick={()=>setEdit(!edit)}>{edit?<><Check size={15}/>Xong</>:<><Pencil size={15}/>Chỉnh sửa</>}</button>}
    </div>

    {edit&&<div className="plan-editor">
      {sel&&pinByCode.get(up(sel))?(()=>{const p=pinByCode.get(up(sel))!;const u=unitByCode.get(up(sel));return <>
        <div className="plan-editor-head"><strong>{p.code}</strong><button className="icon-button" aria-label="Bỏ chọn" onClick={()=>setSel(null)}><X size={16}/></button></div>
        {u?<p className="plan-muted">{u.type||'—'} · {u.area||0} m²{statusOf(u)==='Đã bán'&&' · Đã bán'}</p>:<p className="plan-muted">Mã căn không còn trong bảng hàng.</p>}
        <div className="plan-fund-row">{funds.map(f=><button key={f.key} type="button" className={p.fund===f.key?'on':''} style={p.fund===f.key?{background:f.color,borderColor:f.color,color:'#fff'}:{}} onClick={()=>persist({...p,fund:f.key})}><span className="dot" style={{background:f.color}}/>{f.label}</button>)}</div>
        <p className="plan-muted">Kéo pin trên mặt bằng để đổi vị trí.</p>
        <button className="button subtle plan-remove" onClick={()=>remove(p.code)}><Trash2 size={15}/>Gỡ pin</button>
      </>;})():<>
        <div className="plan-editor-head"><strong>Cắm mã căn ({unplaced.length})</strong></div>
        {!units.length?<p className="plan-muted">Chưa có bảng hàng để cắm pin.</p>:unplaced.length?<>
          <button className={'button '+(placing?'dark':'subtle')} onClick={()=>setPlacing(placing?null:unplaced[0].code)}>{placing?'Dừng cắm pin':'Cắm lần lượt'}</button>
          <div className="plan-code-list">{unplaced.map(u=><button key={u.id} type="button" className={'plan-code'+(placing===u.code?' cur':'')} onClick={()=>setPlacing(u.code)}><span className="m">{u.code}</span><small>{u.type||''}{u.area?` · ${u.area} m²`:''}</small></button>)}</div>
        </>:<p className="plan-muted">Tất cả mã căn đã được cắm pin.</p>}
        <p className="plan-muted">{placing?<><MapPin size={13}/> Bấm lên mặt bằng để cắm pin <b>{placing}</b>.</>:'Chọn một mã căn rồi bấm lên đúng vị trí trên mặt bằng.'}</p>
      </>}
    </div>}
  </div>;
}
