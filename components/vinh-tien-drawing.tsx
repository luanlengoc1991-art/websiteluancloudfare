'use client';
import {useEffect,useRef} from 'react';
import type {Unit} from '@/lib/catalog';
import {VINH_TIEN_SHEET,type DrawingSlot,type DrawingMarker} from '@/lib/green-paradise';
function Frame({slot,marker,code,map=false}:{slot:DrawingSlot;marker:DrawingMarker;code:string;map?:boolean}){
 const frame=useRef<HTMLDivElement>(null),image=useRef<HTMLImageElement>(null);
 const apply=()=>{const f=frame.current,i=image.current;if(!f||!i?.naturalWidth)return;const scale=Math.max(f.clientWidth/i.naturalWidth,f.clientHeight/i.naturalHeight)*slot.zoom,w=i.naturalWidth*scale,h=i.naturalHeight*scale;i.style.width=`${w}px`;i.style.height=`${h}px`;i.style.transform=`translate(calc(-50% + ${(50-slot.x)/50*Math.max(0,(w-f.clientWidth)/2)}px),calc(-50% + ${(50-slot.y)/50*Math.max(0,(h-f.clientHeight)/2)}px))`;};
 useEffect(()=>{apply();const o=new ResizeObserver(apply);if(frame.current)o.observe(frame.current);return()=>o.disconnect();},[slot]);
 return <div ref={frame} className={'vt-frame '+(map?'vt-map':'')}><img ref={image} src={slot.src} alt={`${map?'Mặt bằng':'Phối cảnh'} căn ${code}`} onLoad={apply}/><span className="vt-marker" style={{left:`${marker.x}%`,top:`${marker.y}%`,transform:`translate(-15%,-76%) scale(${marker.scale})`}}>📍<b>{code}</b></span></div>;
}
export default function VinhTienDrawing({unit}:{unit:Unit}){const d=unit.drawing;return <article className="vt-drawing"><header><div><small>VINHOMES GREEN PARADISE · VỊNH TIÊN</small><h2>{unit.code}</h2></div><a href={VINH_TIEN_SHEET} target="_blank" rel="noreferrer">Mở Google Sheet ↗</a></header><div className="vt-facts"><span>{unit.type} · {unit.area} m² đất · {unit.builtArea} m² sàn</span><strong>{unit.price.toLocaleString('vi-VN')} tỷ</strong></div>{d?<><Frame slot={d.main} marker={d.mainMarker} code={unit.code}/><div className="vt-lower"><Frame slot={d.map} marker={d.mapMarker} code={unit.code} map/><div>{d.gallery.map((src,i)=><img src={src} alt={`Hình minh họa ${unit.code} ${i+1}`} key={i}/>)}</div></div></>:<p className="vt-empty">Căn này chưa có bản vẽ được lưu tại nguồn.</p>}<footer>{unit.group} · Vị trí đánh dấu theo bản lưu nguồn</footer></article>;}
