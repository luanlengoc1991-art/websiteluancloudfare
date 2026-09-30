import {getCurrentUser} from '@/lib/auth';
import {database,bucket} from '@/db/store';
export const runtime='nodejs';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{
 const user=await getCurrentUser();const {id}=await params;
 const row=await database().prepare('SELECT * FROM files WHERE id=? AND owner=?').bind(id,user?.userId||'admin').first<{mime:string;name:string;object_key:string}>();
 if(!row||(!user&&row.mime==='application/pdf'))return new Response('Không tìm thấy',{status:404});
 const object=await bucket().get(row.object_key);
 if(!object)return new Response('Không tìm thấy',{status:404});
 // R2 streams carry the Workers stream type; the Response constructor wants the DOM one.
 return new Response(object.body as unknown as ReadableStream,{headers:{'Content-Type':row.mime,'Content-Disposition':`${new URL(req.url).searchParams.has('download')?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(row.name)}`,'Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'}});
}catch(e){console.error(e);return new Response('Kho tài liệu tạm thời chưa khả dụng',{status:503});}}
