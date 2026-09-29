import type {Unit} from './catalog';
export const VINH_TIEN_ORIGIN='https://mat-bang-vinh-tien.lengocluan.chatgpt.site';
export const VINH_TIEN_SHEET='https://docs.google.com/spreadsheets/d/1gUclOuSjDCIRifWv2NmYwBDf8uXUkOsyQhvcNTo2JuA/edit#gid=1343205496';
export type DrawingSlot={src:string;x:number;y:number;zoom:number};
export type DrawingMarker={x:number;y:number;scale:number};
export type UnitDrawing={main:DrawingSlot;map:DrawingSlot;mainMarker:DrawingMarker;mapMarker:DrawingMarker;gallery:string[]};
const numeric=(v:unknown)=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0;};
const text=(v:unknown)=>typeof v==='string'?v.slice(0,500):'';
const clamp=(v:unknown,min:number,max:number,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
function imageUrl(v:unknown){try{const u=new URL(text(v),VINH_TIEN_ORIGIN);return u.origin===VINH_TIEN_ORIGIN?u.href:'';}catch{return '';}}
function slot(v:any):DrawingSlot{return {src:imageUrl(v?.src),x:clamp(v?.x,0,100,50),y:clamp(v?.y,0,100,50),zoom:clamp(v?.zoom,.1,20,1)};}
function marker(v:any):DrawingMarker{return {x:clamp(v?.x,0,100,50),y:clamp(v?.y,0,100,50),scale:clamp(v?.scale,.1,5,1)};}
export function mapGreenParadise(sheet:any,state:any):Unit[]{
 if(!Array.isArray(sheet?.units))throw Error('Invalid source catalog');
 const saved=new Map<string,any>((state?.state?.units??[]).map((u:any)=>[text(u.state?.content?.unitCode).trim().toUpperCase(),u.state]));
 const seen=new Set<string>();
 return sheet.units.flatMap((row:any)=>{
 const code=text(row.unitCode).trim().toUpperCase();if(!code||seen.has(code))return [];seen.add(code);
 const s=saved.get(code);const drawing=s?.images&&s?.mainMarker&&s?.mapMarker?{main:slot(s.images.main),map:slot(s.images.map),mainMarker:marker(s.mainMarker),mapMarker:marker(s.mapMarker),gallery:['gallery1','gallery2','gallery3'].map(k=>imageUrl(s.images[k]?.src)).filter(Boolean)}:undefined;
 return [{id:`green-paradise-${code.toLowerCase()}`,code,projectId:'green-paradise',category:'low',zone:text(row.zone)||'Vịnh Tiên',type:text(row.productType),group:text(row.handover),direction:text(row.direction)||'Chưa cập nhật',area:numeric(row.landArea),builtArea:numeric(row.builtArea),price:numeric(row.price),status:['Còn hàng','Booking','Đã bán'].includes(row.status)?row.status:'Chưa cập nhật',beds:0,floor:0,x:0,y:0,note:'Dữ liệu Google Sheets Vịnh Tiên. Vui lòng xác nhận giá và trạng thái trước khi giao dịch.',sourceLabel:'Google Sheets · Vịnh Tiên',sourceCheckedAt:text(sheet.syncedAt),sourceUrl:VINH_TIEN_SHEET,drawing,posterUrl:drawing?.main.src} as Unit];
 });
}
