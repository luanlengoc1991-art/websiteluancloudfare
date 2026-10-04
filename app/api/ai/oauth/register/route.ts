import {z} from 'zod';
import {database} from '@/db/store';
import {allowedRedirect,oauthError,opaque} from '@/lib/media-oauth';
const schema=z.object({client_name:z.string().trim().min(1).max(100).default('AI connector'),redirect_uris:z.array(z.string().url().max(2000)).min(1).max(5),token_endpoint_auth_method:z.literal('none').optional(),grant_types:z.array(z.enum(['authorization_code','refresh_token'])).optional(),response_types:z.array(z.literal('code')).optional()});
export async function POST(req:Request){
 try{
  if(Number(req.headers.get('content-length')||0)>16000)return oauthError('invalid_client_metadata','Dữ liệu quá lớn.');
  const client=schema.parse(await req.json());
  if(client.redirect_uris.some(uri=>!allowedRedirect(uri,req)))return oauthError('invalid_redirect_uri','Chỉ hỗ trợ callback ChatGPT/Claude.');
  const db=database(),now=Date.now();
  await db.prepare('DELETE FROM ai_oauth_clients WHERE expires<=?').bind(now).run();
  const count=await db.prepare('SELECT COUNT(*) AS n FROM ai_oauth_clients').first<{n:number}>();
  if((count?.n || 0)>=256)return oauthError('temporarily_unavailable','Quá nhiều ứng dụng đã đăng ký.',429);
  const id=opaque();
  await db.prepare('INSERT INTO ai_oauth_clients(id,name,redirect_uris,expires) VALUES(?,?,?,?)').bind(id,client.client_name,JSON.stringify(client.redirect_uris),now+86400000).run();
  return Response.json({...client,client_id:id,client_id_issued_at:Math.floor(now/1000),token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return oauthError('invalid_client_metadata','Không đăng ký được ứng dụng.');}
}
