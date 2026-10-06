import {getSignedInUser} from '@/lib/auth';
import {database,readAll} from '@/db/store';
import {seedUnits} from '@/lib/catalog';
export const runtime='nodejs';
type Record={kind:string;id:string;payload:string};
type Hold={unit_id:string;status:string;expires_at:number};
type StoredFile={id:string;project_id:string;kind:string;name:string};
export async function GET(){try{
 const signedIn=await getSignedInUser();const user=signedIn?.isAdmin?signedIn:null;
 if(!user){
  const [rows,files,holds]=await Promise.all([
   readAll<Record>("SELECT kind,id,payload FROM records WHERE owner='admin' AND kind IN ('project','unit','article','settings','about','guide','pin') ORDER BY id ASC"),
   readAll<StoredFile>("SELECT id,project_id,kind,name FROM files WHERE owner='admin' AND (mime<>'application/pdf' OR ?=1) ORDER BY id ASC",signedIn?.canEdit?1:0),
   readAll<Hold>("SELECT unit_id,status,expires_at FROM reservations WHERE owner='admin' ORDER BY id ASC")
  ]);
  const records=rows.map(r=>{const data=JSON.parse(r.payload);return {kind:r.kind,id:r.id,data:r.kind==='settings'?{brand:data.brand,phone:data.phone,email:data.email,address:data.address,logo:data.logo,alphahubImage:data.alphahubImage}:r.kind==='unit'?{...data,note:''}:r.kind==='guide'&&!data.visible&&!signedIn?.canEdit?{id:r.id,order:data.order,visible:false,title:'',body:''}:data};});
  for(const hold of holds){if(hold.status!=='Đã bán'&&!(hold.status==='Đang giữ chỗ'&&hold.expires_at>Date.now()))continue;const row=records.find(r=>r.kind==='unit'&&r.id===hold.unit_id);if(row)row.data.status=hold.status;else{const seed=seedUnits.find(u=>u.id===hold.unit_id);if(seed)records.push({kind:'unit',id:seed.id,data:{...seed,status:hold.status,note:''}});}}
  return Response.json({user:null,member:signedIn?{email:signedIn.email,canEdit:signedIn.canEdit}:null,records,reservations:[],files:files.map(f=>({id:f.id,projectId:f.project_id,kind:f.kind,name:f.name,url:`/api/files/${f.id}`}))},{headers:{'Cache-Control':'no-store'}});
 }
 const [records,holds,files]=await Promise.all([
  readAll<Record>('SELECT kind,id,payload FROM records WHERE owner=? ORDER BY id ASC',user.userId),
  database().prepare('SELECT * FROM reservations WHERE owner=? ORDER BY created_at DESC LIMIT 500').bind(user.userId).all(),
  readAll<StoredFile>('SELECT id,project_id,kind,name FROM files WHERE owner=? ORDER BY id ASC',user.userId)
 ]);
 return Response.json({user:{name:user.displayName,email:user.email},records:records.map(r=>({kind:r.kind,id:r.id,data:JSON.parse(r.payload)})),reservations:holds.results,files:files.map(f=>({id:f.id,projectId:f.project_id,kind:f.kind,name:f.name,url:`/api/files/${f.id}`}))},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Không thể tải dữ liệu đã lưu. Vui lòng thử lại.'},{status:503});}}
