import {mapGreenParadise} from '@/lib/green-paradise';
import {cachedGreenParadise} from '@/lib/green-paradise-cache';
import {wireResponse} from '@/lib/wire';
import {readVinhTienSheet,readVinhTienState} from '@/lib/vinh-tien-store';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 try{
 return await cachedGreenParadise(req.url,async()=>{
  const [sheet,state]=await Promise.all([readVinhTienSheet() as Promise<any>,readVinhTienState()]);
  return wireResponse({units:mapGreenParadise(sheet,state),syncedAt:sheet.syncedAt,stale:!!sheet.stale},{headers:{'Cache-Control':'no-store'}});
 });
 }catch{return Response.json({error:'Chưa kết nối được dữ liệu Vịnh Tiên. Vui lòng thử lại.'},{status:502});}
}
