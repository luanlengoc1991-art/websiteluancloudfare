import {mapGreenParadise,VINH_TIEN_SHEET} from '@/lib/green-paradise';
import {readVinhTienSheet,readVinhTienState} from '@/lib/vinh-tien-store';
export const dynamic='force-dynamic';
export async function GET(){
 try{
 const [sheet,state]=await Promise.all([readVinhTienSheet() as Promise<any>,readVinhTienState()]);
 return Response.json({units:mapGreenParadise(sheet,state),syncedAt:sheet.syncedAt,stale:!!sheet.stale,sheetUrl:VINH_TIEN_SHEET},{headers:{'Cache-Control':'public, s-maxage=30, stale-while-revalidate=30'}});
 }catch{return Response.json({error:'Chưa kết nối được dữ liệu Vịnh Tiên. Vui lòng thử lại.'},{status:502});}
}
