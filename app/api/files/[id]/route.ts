import {getContentEditor} from '@/lib/auth';
import {database,bucket} from '@/db/store';
export const runtime='nodejs';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{
 const user=await getContentEditor();const {id}=await params;
 const row=await database().prepare('SELECT * FROM files WHERE id=? AND owner=?').bind(id,'admin').first<{mime:string;name:string;object_key:string}>();
 if(!row||(!user&&row.mime==='application/pdf'))return new Response('Không tìm thấy',{status:404});
 const object=await bucket().get(row.object_key,{onlyIf:{etagDoesNotMatch:(req.headers.get('If-None-Match')||'').replace(/^W\//,'').replace(/"/g,'')||undefined}});
 if(!object)return new Response('Không tìm thấy',{status:404});
 if(!('body' in object))return new Response(null,{status:304,headers:{ETag:object.httpEtag,'Cache-Control':'private, no-cache'}});
 // R2 streams carry the Workers stream type; the Response constructor wants the DOM one.
 return new Response(object.body as unknown as ReadableStream,{headers:{'Content-Type':row.mime,'Content-Disposition':`${new URL(req.url).searchParams.has('download')?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(row.name)}`,ETag:object.httpEtag,'Cache-Control':'private, no-cache','X-Content-Type-Options':'nosniff'}});
}catch(e){console.error(e);return new Response('Kho tài liệu tạm thời chưa khả dụng',{status:503});}}
