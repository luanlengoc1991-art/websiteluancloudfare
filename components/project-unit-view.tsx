'use client';

import {useState} from 'react';
import {Calculator,Check,ChevronLeft,ChevronRight,Compass,Copy,Download,FileText,Gift,Heart,Image as ImageIcon,Layers,LayoutGrid,Link as LinkIcon,Lock,MapPin,Maximize,MessageCircle,Minus,PanelLeftClose,PanelLeftOpen,Phone,Plus,RotateCcw,Ruler,WalletCards,X} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {toast} from 'sonner';
import {projectPath} from '@/lib/project-routes';
import type {Asset,Project,Unit} from '@/lib/catalog';

export type ProjectUnitViewProps={open:boolean;unit:Unit;project:Project;assets:Asset[];units:Unit[];status:string;phone:string;favorite:boolean;onClose:()=>void;onFavorite:()=>void;onReserve:()=>void;onSelect:(unit:Unit)=>void};
const number=(n:number)=>n.toLocaleString('vi-VN',{maximumFractionDigits:3});
const price=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>0?`${number(n)} tỷ`:'Chưa cập nhật';
function Picture({src,alt,className=''}:{src:string;alt:string;className?:string}){
 const [failed,setFailed]=useState(false);
 return failed||!src?<div className={'punit-image-empty '+className}><ImageIcon size={32}/><span>Chưa có hình ảnh</span></div>:<img className={className} src={src} alt={alt} onError={()=>setFailed(true)}/>;
}
export default function ProjectUnitView({open,unit,project,assets,units,status,phone,favorite,onClose,onFavorite,onReserve,onSelect}:ProjectUnitViewProps){
 const [railOpen,setRailOpen]=useState(true),[image,setImage]=useState<Asset|null>(null),[zoom,setZoom]=useState(1),[tool,setTool]=useState<'loan'|'price'|'documents'|null>(null),[copied,setCopied]=useState(false);
 const [loanPercent,setLoanPercent]=useState(70),[interest,setInterest]=useState(8),[years,setYears]=useState(20);
 const savedAmenities=assets.filter(a=>a.kind==='amenity');
 const amenities:Asset[]=savedAmenities.length?savedAmenities:project.id==='grand-coast'?[{id:'masteri-reference-amenities',projectId:project.id,kind:'amenity',name:'Mặt bằng tổng thể và tiện ích',url:'https://pub-112acfbefe224fa18ee2bcc30b9a7874.r2.dev/tours/1788496468370_270cccf2.jpg'}]:[];
 const gallery=assets.filter(a=>['gallery','model','panorama'].includes(a.kind));
 const documents=assets.filter(a=>a.kind==='document');
 const layout=unit.layoutUrl;
 const media=amenities.length?amenities:gallery;
 const nearby=units.filter(u=>u.projectId===project.id);const unitIndex=nearby.findIndex(u=>u.id===unit.id);
 const phoneDigits=phone.replace(/\D/g,'');
 const basePrice=typeof unit.price==='number'?unit.price:0;
 const principal=basePrice*1e9*loanPercent/100,months=years*12,rate=interest/1200;
 const payment=months>0?(rate===0?principal/months:principal*rate/(1-Math.pow(1+rate,-months))):0;
 const copy=async()=>{try{await navigator.clipboard.writeText(`${window.location.origin}${projectPath(project.id,'vr')}?product=${encodeURIComponent(unit.code)}`);setCopied(true);toast.success('Đã sao chép liên kết căn.');}catch{toast.error('Không thể sao chép. Vui lòng sao chép địa chỉ trên trình duyệt.');}};
 const move=(offset:number)=>{const next=nearby[unitIndex+offset];if(next){setImage(null);setZoom(1);setCopied(false);onSelect(next);}};
 const download=()=>{
  const rows=[['Mã căn',unit.code],['Dự án',project.name],['Tầng',unit.floor],['Loại hình',unit.type],['Diện tích',unit.area],['Diện tích sàn',unit.builtArea],['Hướng',unit.direction],['Giá tham khảo (tỷ)',unit.price],['Giá TTS',unit.priceTts??''],['Giá TTTĐ',unit.priceTttd??''],['Giá vay',unit.priceLoan??''],['Trạng thái',status]];
  const escape=(v:unknown)=>{let value=String(v??'');if(/^[=+@-]/.test(value))value="'"+value;return '"'+value.replaceAll('"','""')+'"';};
  const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(escape).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`phieu-can-${unit.code.replace(/[^\p{L}\p{N}_-]/gu,'-')}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const showLayout=()=>{if(layout){setImage({id:'unit-layout',projectId:project.id,kind:'plan',name:`Layout ${unit.code}`,url:layout});setZoom(1);}else toast.info('Căn này chưa có layout. Quản trị viên có thể bổ sung đường dẫn mặt bằng trong hồ sơ căn.');};
 return <>
  <Dialog open={open} onOpenChange={v=>{if(!v)onClose();}}>
   <DialogContent className={'punit-view '+(!railOpen?'punit-rail-hidden':'')} showCloseButton={false}>
    <DialogHeader className="sr-only"><DialogTitle>Chi tiết căn {unit.code}</DialogTitle><DialogDescription>{project.name} — hình ảnh, giá và thông tin sản phẩm</DialogDescription></DialogHeader>
    <aside className="punit-rail" aria-label="Tiện ích và hình ảnh dự án">
     <div className="punit-rail-heading"><h2><MapPin size={17}/>{amenities.length?'Tiện ích xung quanh':'Hình ảnh dự án'}</h2><button aria-label="Thu gọn tiện ích" onClick={()=>setRailOpen(false)}><PanelLeftClose size={16}/></button></div>
     <div className="punit-rail-scroll">
      <button className={'punit-amenity '+(!image?'active':'')} onClick={()=>{setImage(null);setZoom(1);}}><Picture src={project.image} alt={project.name}/><span>Phối cảnh {project.name}</span></button>
      {media.map(asset=><button key={asset.id} className={'punit-amenity '+(image?.id===asset.id?'active':'')} onClick={()=>{setImage(asset);setZoom(1);}}><Picture src={asset.url} alt={asset.name}/><span>{asset.name}</span></button>)}
      {!media.length&&<div className="punit-rail-empty"><ImageIcon size={23}/><p>Ảnh tiện ích đang được cập nhật.</p></div>}
     </div>
    </aside>
    <section className="punit-stage" aria-label="Hình ảnh và phiếu căn">
     <div className="punit-stage-top"><div>{!railOpen&&<button className="punit-icon" onClick={()=>setRailOpen(true)} aria-label="Mở tiện ích"><PanelLeftOpen size={18}/></button>}<button className="punit-icon" onClick={onClose} aria-label="Về quỹ căn"><ChevronLeft size={18}/></button><span>{image?.name||'Phiếu thông tin căn'}</span></div><button className={'punit-icon '+(favorite?'selected':'')} onClick={onFavorite} aria-label={favorite?'Bỏ yêu thích':'Yêu thích căn'}><Heart size={18} fill={favorite?'currentColor':'none'}/></button></div>
     <div className="punit-stage-scroll">
      <div className="punit-media-transform" style={{width:`${zoom*100}%`}}>
       {image?<Picture key={image.url} className="punit-original" src={image.url} alt={image.name}/>:unit.posterUrl?<Picture key={unit.posterUrl} className="punit-original" src={unit.posterUrl} alt={`Phiếu căn ${unit.code}`}/>:<article className="punit-poster">
        <header><div><span className="punit-poster-brand">{project.name}</span><small>{project.developer}</small></div><div><h2>{unit.code}</h2><p>{unit.type} | {number(unit.area)} m²</p></div></header>
        <div className="punit-poster-prices"><div><span>GIÁ THAM KHẢO</span><strong>{price(unit.price)}</strong></div><div><span>GIÁ TTS</span><strong>{price(unit.priceTts)}</strong></div><div><span>GIÁ TTTĐ</span><strong>{price(unit.priceTttd)}</strong></div></div>
        <div className="punit-poster-image"><Picture src={project.image} alt={`Phối cảnh ${project.name}`}/><span><MapPin size={17}/>{project.location}</span></div>
        <div className="punit-poster-bottom"><div><span>THÔNG TIN SẢN PHẨM</span><h3>{unit.tower||unit.zone}</h3><p>Tầng {unit.floor} · Hướng {unit.direction}</p><p>{unit.group}</p><small>Phối cảnh dự án, không phải ảnh riêng của căn.</small></div><button onClick={showLayout} className="punit-layout-preview">{layout?<Picture key={layout} src={layout} alt={`Mặt bằng ${unit.code}`}/>:<><LayoutGrid size={32}/><span>Layout căn hộ</span><small>Chưa cập nhật</small></>}</button></div>
        {unit.gift&&<div className="punit-poster-gift"><Gift size={22}/><span>{unit.gift}</span></div>}
        <footer>ALPHA HUB <span>Thông tin tham khảo · Xác nhận với đơn vị phân phối</span></footer>
       </article>}
      </div>
     </div>
     <div className="punit-stage-bottom"><div className="punit-pager"><button disabled={unitIndex<=0} onClick={()=>move(-1)} aria-label="Căn trước"><ChevronLeft size={17}/></button><span>{unitIndex+1} / {nearby.length} căn</span><button disabled={unitIndex>=nearby.length-1} onClick={()=>move(1)} aria-label="Căn tiếp theo"><ChevronRight size={17}/></button></div><div className="punit-media-tools"><button onClick={()=>setZoom(v=>Math.max(.75,v-.25))} aria-label="Thu nhỏ"><Minus size={16}/></button><button onClick={()=>setZoom(1)} aria-label="Vừa khung hình">{Math.round(zoom*100)}%</button><button onClick={()=>setZoom(v=>Math.min(2.5,v+.25))} aria-label="Phóng to"><Plus size={16}/></button><button onClick={copy} aria-label="Sao chép liên kết">{copied?<Check size={16}/>:<Copy size={16}/>}</button>{image?<a href={image.url} target="_blank" rel="noreferrer" aria-label="Mở ảnh gốc"><Maximize size={16}/></a>:<button onClick={download} aria-label="Tải thông tin căn"><Download size={16}/></button>}</div></div>
    </section>
    <aside className="punit-details" aria-label="Thông tin căn">
     <div className="punit-statusbar"><span className={'punit-status '+(status==='Còn hàng'?'available':'unavailable')}>● {status}</span><span>{unit.policyDate?`CSBH: ${unit.policyDate}`:'Thông tin sản phẩm'}</span><div><button aria-label="Đặt lại chế độ xem" onClick={()=>{setImage(null);setZoom(1);}}><RotateCcw size={16}/></button><button aria-label="Đóng chi tiết căn" onClick={onClose}><X size={19}/></button></div></div>
     <div className="punit-detail-scroll">
      <div className="punit-title"><div><h1>{unit.code}</h1><p>{[unit.tower,unit.zone,project.name].filter(Boolean).join(' | ')}</p></div><button onClick={copy} aria-label="Chia sẻ căn"><LinkIcon size={17}/></button></div>
      <div className="punit-facts">{[[Layers,'Tầng',unit.floor],[LayoutGrid,'Loại hình',unit.type],[Ruler,'Diện tích',`${number(unit.area)} m²`],[Maximize,'Diện tích sàn',unit.builtArea>0?`${number(unit.builtArea)} m²`:'Chưa cập nhật'],[Compass,'Hướng',unit.direction]].map(([Icon,label,value])=>{const I=Icon as typeof Layers;return <div key={String(label)}><I size={16}/><span>{String(label)}</span><strong title={String(value)}>{String(value)}</strong></div>;})}</div>
      <section className="punit-pricing"><div className="punit-price-row"><div className="punit-price-main"><span>Giá tham khảo <WalletCards size={15}/></span><strong>{price(unit.price)}</strong><small>Liên hệ xác nhận giá và trạng thái</small></div><div className="punit-price-meter"><span>Đơn giá tham khảo</span><strong>{unit.area>0&&unit.price>0?`${number(unit.price*1000/unit.area)} triệu/m²`:'Chưa cập nhật'}</strong></div></div><div className="punit-price-tools"><button onClick={download}><FileText size={13}/>Phiếu giá</button><button onClick={()=>setTool('loan')}><Calculator size={13}/>Tính lãi vay</button><button onClick={()=>setTool('price')}><WalletCards size={13}/>Chi tiết giá</button></div></section>
      <div className="punit-contact"><span className="punit-contact-avatar">A</span><div><small>LIÊN HỆ</small><strong>Quản trị viên</strong></div>{phoneDigits?<><a href={`https://zalo.me/${phoneDigits}`} target="_blank" rel="noreferrer" aria-label="Liên hệ Zalo"><MessageCircle size={16}/></a><a href={`tel:${phone}`} aria-label="Gọi tư vấn"><Phone size={16}/></a></>:<span className="punit-contact-note">Chưa có hotline</span>}<button className="punit-lock" onClick={onReserve} disabled={status!=='Còn hàng'}><Lock size={15}/>GIỮ CĂN</button></div>
      <section className="punit-card"><h2><WalletCards size={14}/>Giá chi tiết</h2><div className="punit-price-grid">{[['Giá TTS',unit.priceTts],['Giá vay',unit.priceLoan],['Giá TTTĐ',unit.priceTttd],['Tổng giá trị',unit.totalPrice]].map(([label,value])=><div key={String(label)}><span>{String(label)}</span><strong>{price(value)}</strong></div>)}</div></section>
      <section className="punit-card"><h2><FileText size={14}/>Bàn giao & tài liệu</h2><div className="punit-handover"><span>Nhóm quỹ</span><strong>{unit.group||'Chưa cập nhật'}</strong></div><div className="punit-doclinks"><button onClick={()=>setTool('documents')}><FileText size={19}/><span>Chính sách</span></button><button onClick={showLayout}><LayoutGrid size={19}/><span>Layout thiết kế</span></button><button onClick={()=>setTool('documents')}><Download size={19}/><span>Tài liệu dự án</span></button></div></section>
      <section className="punit-card"><h2><Gift size={14}/>Chính sách & Quà tặng</h2><div className="punit-price-grid"><div><span>CSBH áp dụng</span><strong>{unit.policyDate||'Chưa cập nhật'}</strong></div><div><span>Ưu đãi đặc biệt</span><strong>{unit.gift||'Chưa cập nhật'}</strong></div></div></section>
      <p className="punit-disclaimer">{unit.sourceLabel&&<><strong>{unit.sourceLabel}</strong> · {unit.sourceCheckedAt?new Date(unit.sourceCheckedAt).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):''}<br/>Bản ghi tại thời điểm cập nhật, không đồng bộ trực tiếp. Cần xác nhận lại giá và trạng thái.<br/></>}{unit.note||'Thông tin và hình ảnh mang tính tham khảo. Vui lòng xác nhận với quản trị viên trước khi giao dịch.'}</p>
     </div>
    </aside>
   </DialogContent>
  </Dialog>
  <Dialog open={!!tool} onOpenChange={v=>{if(!v)setTool(null);}}><DialogContent className="punit-tool-dialog"><DialogHeader><DialogTitle>{tool==='loan'?'Ước tính khoản vay':tool==='price'?'Thông tin giá':'Tài liệu dự án'}</DialogTitle><DialogDescription>{unit.code} · {project.name}</DialogDescription></DialogHeader>
   {tool==='loan'&&<div className="stack"><p>Giá tham khảo: <strong>{price(basePrice)}</strong></p><label className="field"><span>Tỷ lệ vay (%)</span><input type="number" min={0} max={100} value={loanPercent} onChange={e=>setLoanPercent(Math.min(100,Math.max(0,Number(e.target.value))))}/></label><label className="field"><span>Lãi suất giả định (%/năm)</span><input type="number" min={0} max={50} step="0.1" value={interest} onChange={e=>setInterest(Math.min(50,Math.max(0,Number(e.target.value))))}/></label><label className="field"><span>Thời hạn (năm)</span><input type="number" min={1} max={40} value={years} onChange={e=>setYears(Math.min(40,Math.max(1,Number(e.target.value))))}/></label><div className="punit-loan-result"><span>Khoản trả đều mỗi tháng (ước tính)</span><strong>{number(Math.round(payment))} đ</strong></div><p className="small muted">Giả định lãi suất cố định và trả góp đều, chưa gồm phí hoặc bảo hiểm. Đây là phép tính minh họa, không phải báo giá hay cam kết cho vay của ngân hàng.</p></div>}
   {tool==='price'&&<div className="punit-price-grid">{[['Giá tham khảo',unit.price],['Giá TTS',unit.priceTts],['Giá TTTĐ',unit.priceTttd],['Giá vay',unit.priceLoan],['Tổng giá trị',unit.totalPrice]].map(([label,value])=><div key={String(label)}><span>{String(label)}</span><strong>{price(value)}</strong></div>)}</div>}
   {tool==='documents'&&<div className="stack">{documents.length?documents.map(a=><a className="punit-document" key={a.id} href={a.url+'?download=1'} target="_blank" rel="noreferrer"><FileText size={20}/><span>{a.name}</span><Download size={16}/></a>):<p>Chưa có tài liệu được cấp quyền xem. Vui lòng liên hệ quản trị viên.</p>}</div>}
  </DialogContent></Dialog>
 </>;
}
