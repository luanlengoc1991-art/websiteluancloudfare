import {mapGreenParadise,VINH_TIEN_ORIGIN,VINH_TIEN_SHEET} from '@/lib/green-paradise';
export const dynamic='force-dynamic';
export async function GET(){
 try{
 const read=async(path:string)=>{const r=await fetch(VINH_TIEN_ORIGIN+path,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Source unavailable');return r.json();};
 const [sheet,state]=await Promise.all([read('/api/sheet'),read('/api/state')]);
 return Response.json({units:mapGreenParadise(sheet,state),syncedAt:sheet.syncedAt,stale:!!sheet.stale,sheetUrl:VINH_TIEN_SHEET},{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=30'}});
 }catch{return Response.json({error:'Chưa kết nối được dữ liệu Vịnh Tiên. Vui lòng thử lại.'},{status:502});}
}
