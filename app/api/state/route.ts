import {getSignedInUser} from '@/lib/auth';
import {database} from '@/db/store';
import {rest,readAll} from '@/lib/supabase-server';
import {seedUnits} from '@/lib/catalog';
export async function GET(){try{
 const signedIn=await getSignedInUser();const user=signedIn?.isAdmin?signedIn:null;
 if(!user){
  const [rows,files,holds]=await Promise.all([
   readAll('alpha_records?owner=eq.admin&kind=in.(project,unit,article,settings)&select=kind,id,payload&order=id.asc'),
   readAll('alpha_files?owner=eq.admin&mime=neq.application%2Fpdf&select=id,project_id,kind,name&order=id.asc'),
   readAll('alpha_reservations?owner=eq.admin&select=unit_id,status,expires_at&order=id.asc')
  ]);
  const records=rows.map((r:any)=>{const data=JSON.parse(r.payload);return {kind:r.kind,id:r.id,data:r.kind==='settings'?{brand:data.brand,phone:data.phone,email:data.email,address:data.address}:r.kind==='unit'?{...data,note:''}:data};});
  for(const hold of holds){if(hold.status!=='Đã bán'&&!(hold.status==='Đang giữ chỗ'&&hold.expires_at>Date.now()))continue;const row=records.find((r:any)=>r.kind==='unit'&&r.id===hold.unit_id);if(row)row.data.status=hold.status;else{const seed=seedUnits.find(u=>u.id===hold.unit_id);if(seed)records.push({kind:'unit',id:seed.id,data:{...seed,status:hold.status,note:''}});}}
  return Response.json({user:null,member:signedIn?{email:signedIn.email}:null,records,reservations:[],files:files.map((f:any)=>({id:f.id,projectId:f.project_id,kind:f.kind,name:f.name,url:`/api/files/${f.id}`}))},{headers:{'Cache-Control':'no-store'}});
 }
 const db=database();const [records,holds,files]=await Promise.all([db.prepare('SELECT kind,id,payload FROM records WHERE owner=?').bind(user.userId).all(),db.prepare('SELECT * FROM reservations WHERE owner=? ORDER BY created_at DESC LIMIT 500').bind(user.userId).all(),db.prepare('SELECT id,project_id AS projectId,kind,name FROM files WHERE owner=?').bind(user.userId).all()]);
 return Response.json({user:{name:user.displayName,email:user.email},records:records.results.map((r:any)=>({kind:r.kind,id:r.id,data:JSON.parse(r.payload)})),reservations:holds.results,files:files.results.map((f:any)=>({id:f.id,projectId:f.projectId,kind:f.kind,name:f.name,url:`/api/files/${f.id}`}))},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Không thể tải dữ liệu đã lưu. Vui lòng thử lại.'},{status:503});}}
