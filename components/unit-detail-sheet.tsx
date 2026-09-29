'use client';

import {useMemo, useState} from 'react';
import Link from './site-link';
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  Compass,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  GitCompareArrows,
  Heart,
  History,
  Image as ImageIcon,
  Info,
  Layers,
  Map,
  MapPin,
  Maximize,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Ruler,
  Share2,
  Sparkles,
  WalletCards,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from '@/components/ui/sheet';
import {toast} from 'sonner';
import type {Asset, Customer, Project, Reservation, Unit} from '@/lib/catalog';
import {projectPath} from '@/lib/project-routes';
import ProjectUnitView from './project-unit-view';

type UnitDetailSheetProps={
  immersive?:boolean;
  open:boolean;
  unit:Unit|null;
  project:Project;
  units:Unit[];
  assets:Asset[];
  reservations:Reservation[];
  customers:Customer[];
  now:number;
  contactPhone?:string;
  statusOf:(unit:Unit)=>string;
  favorite:boolean;
  compared:boolean;
  onOpenChange:(open:boolean)=>void;
  onFavorite:()=>void;
  onCompare:()=>void;
  onReserve:()=>void;
  onSelectRelated:(unit:Unit)=>void;
};

type DetailAsset=Asset&{source?:'cover'};

const fmt=(value:number)=>value.toLocaleString('vi-VN',{maximumFractionDigits:3});
const statusClass=(status:string)=>status==='Còn hàng'?'available':status==='Đã bán'?'sold':'held';

function DetailPicture({src,alt,className=''}:{src:string;alt:string;className?:string}){
  const [broken,setBroken]=useState(false);
  if(broken||!src)return <div className={'image-fallback '+className}><Building2/><span>{alt}</span></div>;
  return <img className={className} src={src} alt={alt} loading="lazy" onError={()=>setBroken(true)}/>;
}

function downloadUnit(unit:Unit,project:Project,status:string){
  const rows=[
    ['Mã căn',unit.code],['Dự án',project.name],['Tòa',unit.tower||'Tòa chính'],['Tầng',unit.floor],
    ['Loại hình',unit.type],['Phân khu',unit.zone],['Diện tích',`${unit.area} m²`],['Diện tích sàn',unit.builtArea>0?`${unit.builtArea} m²`:'Chưa cập nhật'],
    ['Phòng ngủ',unit.beds],['Hướng',unit.direction],['Nhóm quỹ',unit.group],['Giá tham khảo',`${unit.price} tỷ`],['Trạng thái',status],['Ghi chú',unit.note||''],
  ];
  const csv='\uFEFF'+rows.map(([label,value])=>`"${String(label).replaceAll('"','""')}";"${String(value??'').replaceAll('"','""')}"`).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a');
  link.href=url;
  link.download=`thong-tin-${unit.code}.csv`;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export default function UnitDetailSheet({immersive=false,open,unit,project,units,assets,reservations,customers,now,statusOf,contactPhone='',favorite,compared,onOpenChange,onFavorite,onCompare,onReserve,onSelectRelated}:UnitDetailSheetProps){
  const [tab,setTab]=useState('overview');
  const [lightbox,setLightbox]=useState<DetailAsset|null>(null);
  const [planZoom,setPlanZoom]=useState(1);
  const status=unit?statusOf(unit):'';
  const planAssets=assets.filter(asset=>asset.kind==='plan');
  const galleryAssets=useMemo<DetailAsset[]>(()=>[
    {id:`cover-${project.id}`,projectId:project.id,kind:'gallery',name:'Phối cảnh tổng thể',url:project.image,source:'cover'},
    ...assets.filter(asset=>['gallery','model','amenity'].includes(asset.kind)),
  ],[assets,project.id,project.image]);
  const documentAssets=assets.filter(asset=>asset.kind==='document');
  const relatedUnits=useMemo(()=>{
    if(!unit)return [];
    return units.filter(candidate=>candidate.id!==unit.id&&candidate.projectId===unit.projectId)
      .sort((a,b)=>{
        const score=(candidate:Unit)=>(candidate.type===unit.type?4:0)+(candidate.zone===unit.zone?3:0)+(candidate.floor===unit.floor?2:0)+(statusOf(candidate)==='Còn hàng'?1:0);
        return score(b)-score(a)||Math.abs(a.area-unit.area)-Math.abs(b.area-unit.area);
      }).slice(0,6);
  },[statusOf,unit,units]);
  const unitReservations=unit?reservations.filter(item=>item.unit_id===unit.id).sort((a,b)=>b.created_at-a.created_at):[];
  const numeric=(value:number|string|undefined,fallback=0)=>{
    const parsed=typeof value==='number'?value:Number(String(value??'').replace(/[^0-9.,-]/g,'').replace(/\.(?=.*\.)/g,'').replace(',','.'));
    return Number.isFinite(parsed)&&parsed>0?parsed:fallback;
  };
  const pricePerM2=unit&&unit.area?numeric(unit.pricePerMeter,unit.price*1000/unit.area):0;
  const priceTts=unit?numeric(unit.priceTts,unit.price):0;
  const priceTttd=unit?numeric(unit.priceTttd,numeric(unit.totalPrice,unit.price)):0;
  const priceLoan=unit?numeric(unit.priceLoan,0):0;
  const totalPrice=unit?numeric(unit.totalPrice,unit.price):0;
  const estimateVat=unit?numeric(unit.price)*.1:0;
  const estimateFees=unit?numeric(unit.price)*.03:0;

  const copyLink=()=>{
    if(!unit)return;
    navigator.clipboard.writeText(`${window.location.origin}/quy-hang?unit=${unit.id}`).then(()=>toast.success('Đã sao chép liên kết căn.')).catch(()=>toast.error('Không thể sao chép liên kết.'));
  };
  const copyCode=()=>{
    if(!unit)return;
    navigator.clipboard.writeText(unit.code).then(()=>toast.success('Đã sao chép mã căn.')).catch(()=>toast.error('Không thể sao chép mã căn.'));
  };
  const planHref=projectPath(project.id,'plan');
  const vrHref=`${projectPath(project.id,'vr')}?product=${encodeURIComponent(unit?.code||'')}`;
  const zaloHref=contactPhone?`https://zalo.me/${contactPhone.replace(/\D/g,'')}`:'';

  if(immersive&&unit)return <ProjectUnitView key={unit.projectId==='green-paradise'?unit.projectId:unit.id} open={open} unit={unit} project={project} assets={assets} units={units} status={status} phone={contactPhone} favorite={favorite} onClose={()=>onOpenChange(false)} onFavorite={onFavorite} onReserve={onReserve} onSelect={onSelectRelated}/>;

  return <Sheet open={open&&!!unit} onOpenChange={onOpenChange}>
    <SheetContent className="unit-sheet unit-detail-sheet">
      <SheetHeader className="unit-sheet-header">
        <div className="unit-sheet-heading">
          <div>
            <span className="eyebrow brown">HỒ SƠ SẢN PHẨM</span>
            <SheetTitle>{unit?.code||'Chi tiết căn'}</SheetTitle>
            <SheetDescription>{project.name} · {project.location}</SheetDescription>
          </div>
          {unit&&<button className={'unit-sheet-favorite '+(favorite?'is-favorite':'')} aria-label={favorite?'Bỏ yêu thích':'Lưu căn yêu thích'} onClick={onFavorite}><Heart size={19} fill={favorite?'currentColor':'none'}/></button>}
        </div>
        {unit&&<div className="unit-sheet-meta"><span className={`status ${statusClass(status)}`}>{status}</span><span><Building2 size={14}/>{unit.tower||'Tòa chính'}</span><span><Layers size={14}/>Tầng {unit.floor}</span></div>}
      </SheetHeader>
      {unit&&<div className="unit-detail-scroll">
        <div className="unit-detail-hero">
          <DetailPicture src={project.image} alt={project.name}/>
          <div className="unit-detail-hero-overlay"><span>{unit.type}</span><button aria-label="Mở ảnh dự án" onClick={()=>setLightbox(galleryAssets[0])}><Maximize size={16}/></button></div>
        </div>
        <div className="unit-detail-actions">
          <button className="button subtle unit-code-action" onClick={copyCode}><BadgeCheck size={16}/>Sao chép mã</button>
          <button className="button subtle" onClick={onFavorite}><Heart size={16} fill={favorite?'currentColor':'none'}/>{favorite?'Đã lưu':'Yêu thích'}</button>
          <button className={'button subtle '+(compared?'chosen':'')} onClick={onCompare}><GitCompareArrows size={16}/>{compared?'Đã so sánh':'So sánh'}</button>
          <button className="button subtle" onClick={copyLink}><Share2 size={16}/>Chia sẻ</button>
          <button className="button subtle" onClick={()=>downloadUnit(unit,project,status)}><FileDown size={16}/>Tải thông tin</button>
        </div>
        <Tabs value={tab} onValueChange={value=>{setTab(value);setPlanZoom(1);}} className="unit-detail-tabs">
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="plan"><Map size={14}/>Mặt bằng</TabsTrigger>
            <TabsTrigger value="gallery"><ImageIcon size={14}/>Hình ảnh</TabsTrigger>
            <TabsTrigger value="policy"><WalletCards size={14}/>Chính sách</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab==='overview'&&<div className="unit-detail-content">
          <section className="unit-price-card"><div><span className="small muted">GIÁ THAM KHẢO</span><strong>{fmt(unit.price)} <small>tỷ đồng</small></strong><span className="small muted">Khoảng {fmt(pricePerM2)} triệu/m² · dữ liệu mẫu</span></div><BadgeCheck size={28}/></section>
          <div className="unit-detail-grid">{[
            ['Loại hình',unit.type],['Phân khu',unit.zone],['Tòa / tầng',`${unit.tower||'Tòa chính'} · ${unit.floor}`],['Phòng ngủ',unit.beds?`${unit.beds} phòng`:'Studio'],
            ['Diện tích',`${fmt(unit.area)} m²`],['Diện tích sàn',unit.builtArea>0?`${fmt(unit.builtArea)} m²`:'Chưa cập nhật'],['Hướng',unit.direction],['Nhóm quỹ',unit.group],
          ].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <section className="unit-detail-section"><div className="unit-section-title"><div><span className="eyebrow brown">CHI TIẾT GIÁ & CHÍNH SÁCH</span><h3>Thông tin thương mại</h3></div><WalletCards size={17}/></div><div className="unit-commercial-grid"><div><span>Giá TTS</span><strong>{priceTts?`${fmt(priceTts)} tỷ`:'Đang cập nhật'}</strong></div><div><span>Giá TTTĐ</span><strong>{priceTttd?`${fmt(priceTttd)} tỷ`:'Đang cập nhật'}</strong></div><div><span>Giá vay</span><strong>{priceLoan?`${fmt(priceLoan)} tỷ`:'Đang cập nhật'}</strong></div><div><span>Tổng giá trị</span><strong>{totalPrice?`${fmt(totalPrice)} tỷ`:'Đang cập nhật'}</strong></div></div>{(unit.gift||unit.policyDate)&&<p className="small muted">{unit.gift&&<>Quà tặng: {unit.gift}</>}{unit.gift&&unit.policyDate&&' · '}{unit.policyDate&&<>Cập nhật chính sách: {unit.policyDate}</>}</p>}</section>
          <section className="unit-detail-section"><div className="unit-section-title"><div><span className="eyebrow brown">TỔNG GIÁ TRỊ THAM KHẢO</span><h3>Ước tính để tư vấn</h3></div><Info size={17}/></div><div className="unit-breakdown"><div><span>Giá sản phẩm</span><strong>{fmt(unit.price)} tỷ</strong></div><div><span>VAT ước tính</span><strong>{fmt(estimateVat)} tỷ</strong></div><div><span>Phí khác ước tính</span><strong>{fmt(estimateFees)} tỷ</strong></div><div className="total"><span>Tổng dự kiến</span><strong>{fmt(unit.price+estimateVat+estimateFees)} tỷ</strong></div></div><p className="small muted">Các khoản trên chỉ là phép tính minh họa để trao đổi nội bộ, không phải bảng giá hoặc nghĩa vụ thanh toán chính thức.</p></section>
          <section className="unit-detail-section"><div className="unit-section-title"><div><span className="eyebrow brown">GHI CHÚ SẢN PHẨM</span><h3>Thông tin tư vấn</h3></div><Sparkles size={17}/></div><p className="detail-note">{unit.note||'Chưa có ghi chú cho căn này.'}</p><div className="unit-inline-links"><Link href={vrHref}><Maximize size={15}/>Xem căn trong 360°</Link><Link href={planHref}><Map size={15}/>Mở mặt bằng</Link></div></section>
          <section className="unit-detail-section"><div className="unit-section-title"><div><span className="eyebrow brown">CĂN TƯƠNG TỰ</span><h3>Gợi ý trong cùng dự án</h3></div><span className="small muted">{relatedUnits.length} căn</span></div><div className="related-units">{relatedUnits.map(related=><button key={related.id} onClick={()=>onSelectRelated(related)}><div><strong>{related.code}</strong><span className={`status ${statusClass(statusOf(related))}`}>{statusOf(related)}</span></div><p>{related.type} · {fmt(related.area)} m² · Tầng {related.floor}</p><b>{fmt(related.price)} tỷ</b></button>)}</div></section>
        </div>}
        {tab==='plan'&&<div className="unit-detail-content"><section className="unit-detail-section"><div className="unit-section-title"><div><span className="eyebrow brown">MẶT BẰNG DỰ ÁN</span><h3>Vị trí căn trên bản vẽ</h3></div><div className="plan-controls"><button aria-label="Thu nhỏ mặt bằng" onClick={()=>setPlanZoom(Math.max(.65,planZoom-.2))}><ZoomOut size={16}/></button><button aria-label="Phóng to mặt bằng" onClick={()=>setPlanZoom(Math.min(2.5,planZoom+.2))}><ZoomIn size={16}/></button><button aria-label="Đặt lại mặt bằng" onClick={()=>setPlanZoom(1)}><RotateCcw size={16}/></button></div></div>{unit.layoutUrl&&<a className="unit-layout-link" href={unit.layoutUrl} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Mở mặt bằng căn gốc</a>}{planAssets.length?<div className="unit-plan-view"><div style={{transform:`scale(${planZoom})`}}><img src={planAssets[0].url} alt={`Mặt bằng ${project.name}`}/><span className="unit-plan-pin" style={{left:`${unit.x}%`,top:`${unit.y}%`}}>{unit.code}</span></div></div>:<div className="unit-plan-empty"><Map size={32}/><h3>Chưa có file mặt bằng</h3><p>Tọa độ căn đã được lưu để sử dụng khi bạn tải bản vẽ dự án lên thư viện.</p><Link className="button subtle" href={planHref}><ExternalLink size={16}/>Mở mặt bằng dự án</Link></div>}<p className="small muted">Tọa độ hiển thị là dữ liệu minh họa theo hồ sơ căn; hãy đối chiếu với bản vẽ được quản trị tải lên trước khi tư vấn.</p></section></div>}
        {tab==='gallery'&&<div className="unit-detail-content"><section className="unit-detail-section"><div className="unit-section-title"><div><span className="eyebrow brown">THƯ VIỆN CĂN & DỰ ÁN</span><h3>Hình ảnh tham khảo</h3></div><span className="small muted">{galleryAssets.length} ảnh</span></div><div className="unit-gallery-grid">{galleryAssets.map(asset=><button key={asset.id} onClick={()=>setLightbox(asset)}><DetailPicture src={asset.url} alt={asset.name}/><span>{asset.name}<Maximize size={15}/></span></button>)}</div></section></div>}
        {tab==='policy'&&<div className="unit-detail-content"><section className="unit-detail-section"><div className="unit-section-title"><div><span className="eyebrow brown">CHÍNH SÁCH & TÀI LIỆU</span><h3>Hồ sơ hỗ trợ tư vấn</h3></div><FileText size={17}/></div><div className="policy-list"><div><Check size={17}/><div><strong>Kiểm tra trạng thái</strong><p>{status==='Còn hàng'?'Căn đang được ghi nhận còn hàng trong dữ liệu nội bộ.':'Căn hiện không ở trạng thái sẵn sàng giữ chỗ.'}</p></div></div><div><CalendarDays size={17}/><div><strong>Quy trình giữ chỗ</strong><p>Thời hạn và khách hàng sẽ được xác nhận trong cửa sổ giữ chỗ nội bộ.</p></div></div><div><Info size={17}/><div><strong>Lưu ý pháp lý</strong><p>Chính sách, giá bán và điều kiện giao dịch chính thức cần được xác nhận từ đơn vị phân phối.</p></div></div></div>{documentAssets.length?<div className="unit-documents">{documentAssets.map(asset=><a key={asset.id} href={asset.url+'?download=1'} target="_blank" rel="noreferrer"><FileText size={20}/><span><strong>{asset.name}</strong><small>Tải tài liệu</small></span><Download size={16}/></a>)}</div>:<div className="unit-plan-empty compact"><FileText size={27}/><p>Chưa có tài liệu chính sách gắn với dự án này.</p><Link className="button subtle" href={`/thu-vien?project=${encodeURIComponent(project.id)}`}><Plus size={16}/>Thêm tài liệu</Link></div>}</section></div>}
        <section className="unit-detail-section unit-history-section"><div className="unit-section-title"><div><span className="eyebrow brown">LỊCH SỬ HỆ THỐNG</span><h3>Hoạt động trên căn</h3></div><History size={17}/></div>{unitReservations.length?<div className="unit-history-list">{unitReservations.map(item=>{const customer=customers.find(candidate=>candidate.id===item.customer_id);const expired=item.status==='Đang giữ chỗ'&&item.expires_at<now;return <div key={item.id}><span className="history-dot"/><div><strong>{expired?'Hết hạn':item.status}</strong><p>{customer?.name||'Khách hàng nội bộ'} · {new Date(item.created_at).toLocaleString('vi-VN')}</p><small>{item.note||'Không có ghi chú'}</small></div></div>;})}</div>:<p className="small muted">Chưa có lịch sử giữ chỗ hoặc giao dịch trên căn này.</p>}</section>
        <div className="unit-sheet-footer"><div className="unit-contact-actions">{project.image&&<Link className="button subtle" href={planHref}><MapPin size={16}/>Mặt bằng dự án</Link>}<Link className="button subtle" href={vrHref}><Maximize size={16}/>Xem trong 360°</Link>{zaloHref&&<a className="button subtle" href={zaloHref} target="_blank" rel="noreferrer"><MessageCircle size={16}/>Liên hệ Zalo</a>}{status==='Còn hàng'&&<button className="button dark" onClick={onReserve}><WalletCards size={17}/>Giữ chỗ nội bộ</button>}{status!=='Còn hàng'&&<button className="button subtle" disabled><Check size={16}/>Không khả dụng</button>}</div><div className="unit-contact-note">{project.location} · <a href={project.lat&&project.lng?`https://www.google.com/maps/search/?api=1&query=${project.lat},${project.lng}`:'#'} target="_blank" rel="noreferrer"><MapPin size={13}/>Mở bản đồ</a>{project.developer&&<span> · {project.developer}</span>}</div></div>
      </div>}
    </SheetContent>
    <Dialog open={!!lightbox} onOpenChange={value=>{if(!value)setLightbox(null);}}><DialogContent className="unit-lightbox"><DialogHeader><DialogTitle>{lightbox?.name}</DialogTitle><DialogDescription>{project.name} · ảnh tham khảo</DialogDescription></DialogHeader>{lightbox&&<><DetailPicture src={lightbox.url} alt={lightbox.name}/><a className="button subtle" href={lightbox.url} target="_blank" rel="noreferrer"><ExternalLink size={16}/>Mở ảnh gốc</a></>}</DialogContent></Dialog>
  </Sheet>;
}
