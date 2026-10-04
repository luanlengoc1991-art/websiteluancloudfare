import {cookies} from 'next/headers';
import {createHmac} from 'node:crypto';
import {database} from '@/db/store';
import {getCurrentUser,sessionCookie,tokenHash} from '@/lib/auth';
import {isSameOrigin} from '@/lib/request-origin';
import {authorizeParams,oauthError,opaque,publicOrigin,mediaResource} from '@/lib/media-oauth';
const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const nonce=async(query:string)=>createHmac('sha256',(await cookies()).get(sessionCookie)?.value || '').update(query).digest('hex');
export async function GET(req:Request){
 try{
  const url=new URL(req.url),client=await authorizeParams(url.searchParams,req),admin=await getCurrentUser();
  if(!admin)return Response.redirect(publicOrigin(req)+'/dang-nhap?return_to='+encodeURIComponent(url.pathname+url.search),303);
  const query=url.searchParams.toString();
  return new Response(`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kết nối ảnh Alpha HUB</title><body style="font:16px system-ui;background:#edf6f0;color:#153e30;padding:32px"><main style="max-width:600px;margin:auto;background:white;padding:32px;border-radius:16px"><h1>Kết nối ${escape(client.name)}</h1><p>Tài khoản: ${escape(admin.email)}</p><p>Ứng dụng được tìm ảnh trong Thư viện, tải ảnh vào Cloudflare và đổi ảnh dự án, bài viết, căn hoặc nền website. Mọi ảnh tải lên là ảnh công khai; ảnh cũ được giữ lại. Quyền này không cho phép đọc khách hàng, sửa tài khoản hay triển khai mã nguồn.</p><p>Callback: ${escape(url.searchParams.get('redirect_uri')!)}</p><form method="post"><input type="hidden" name="query" value="${escape(query)}"><input type="hidden" name="nonce" value="${await nonce(query)}"><button name="decision" value="allow">Kết nối và cho phép sửa ảnh</button> <button name="decision" value="deny">Hủy</button></form><p>Có thể thu hồi kết nối trong Quản trị → AI sửa website.</p></main></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'}});
 }catch{return oauthError('invalid_request','Yêu cầu kết nối không hợp lệ.');}
}
export async function POST(req:Request){
 try{
  if(!isSameOrigin(req))return oauthError('invalid_request','Yêu cầu không hợp lệ.',403);
  const admin=await getCurrentUser();if(!admin)return oauthError('access_denied','Chỉ tài khoản quản trị được kết nối.',403);
  const form=await req.formData(),query=String(form.get('query')||'');
  if(query.length>12000||form.get('nonce')!==await nonce(query))return oauthError('invalid_request','Phiên xác nhận không hợp lệ.',403);
  const params=new URLSearchParams(query),client=await authorizeParams(params,req),callback=new URL(params.get('redirect_uri')!);
  callback.searchParams.set('state',params.get('state')!);
  if(form.get('decision')!=='allow'){callback.searchParams.set('error','access_denied');return Response.redirect(callback,303);}
  const code=opaque(),db=database();
  await db.batch([db.prepare('UPDATE ai_oauth_clients SET expires=? WHERE id=?').bind(Date.now()+365*86400000,client.id),db.prepare('DELETE FROM ai_oauth_codes WHERE expires<=?').bind(Date.now()),db.prepare('INSERT INTO ai_oauth_codes(hash,client_id,redirect_uri,challenge,email,resource,expires) VALUES(?,?,?,?,?,?,?)').bind(tokenHash(code),client.id,params.get('redirect_uri'),params.get('code_challenge'),admin.email,mediaResource(req),Date.now()+300000)]);
  callback.searchParams.set('code',code);return Response.redirect(callback,303);
 }catch{return oauthError('invalid_request','Không xác nhận được kết nối.');}
}
