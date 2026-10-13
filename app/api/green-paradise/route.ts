import {mapGreenParadise} from '@/lib/green-paradise';
import {wireResponse} from '@/lib/wire';
import {readVinhTienSheet,readVinhTienState} from '@/lib/vinh-tien-store';
export const dynamic='force-dynamic';
export async function GET(){
 try{
 const [sheet,state]=await Promise.all([readVinhTienSheet() as Promise<any>,readVinhTienState()]);
 return await wireResponse({units:mapGreenParadise(sheet,state),syncedAt:sheet.syncedAt,stale:!!sheet.stale},{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=30'}});
 }catch{return Response.json({error:'Chưa kết nối được dữ liệu Vịnh Tiên. Vui lòng thử lại.'},{status:502});}
}
