import {database} from '@/db/store';
import {adminEmail,tokenHash} from '@/lib/auth';
import {issueTokens,mediaResource,oauthError,pkce} from '@/lib/media-oauth';
export async function POST(req:Request){
 try{
  if(Number(req.headers.get('content-length')||0)>16000)return oauthError('invalid_request','Dữ liệu quá lớn.');
  const params=new URLSearchParams(await req.text()),db=database(),clientId=params.get('client_id');
  if(!clientId||params.get('resource')!==mediaResource(req))return oauthError('invalid_target','Resource không hợp lệ.');
  if(params.get('grant_type')==='authorization_code'){
   const hash=tokenHash(params.get('code')||''),row=await db.prepare('SELECT * FROM ai_oauth_codes WHERE hash=? AND expires>?').bind(hash,Date.now()).first<{client_id:string;redirect_uri:string;challenge:string;email:string;resource:string}>();
   const verifier=params.get('code_verifier')||'';
   if(!row||row.client_id!==clientId||row.email!==adminEmail()||row.resource!==mediaResource(req)||row.redirect_uri!==params.get('redirect_uri')||!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)||pkce(verifier)!==row.challenge)return oauthError('invalid_grant','Mã kết nối hoặc PKCE không hợp lệ.');
   const used=await db.prepare('DELETE FROM ai_oauth_codes WHERE hash=?').bind(hash).run();
   if(!used.meta.changes)return oauthError('invalid_grant','Mã đã được dùng.');
   return await issueTokens(clientId,row.email,row.resource);
  }
  if(params.get('grant_type')==='refresh_token'){
   const hash=tokenHash(params.get('refresh_token')||''),row=await db.prepare('SELECT t.email,t.resource,t.connection_id FROM ai_oauth_tokens t JOIN ai_oauth_connections c ON c.id=t.connection_id WHERE t.refresh_hash=? AND t.client_id=? AND t.refresh_expires>? AND c.revoked=0').bind(hash,clientId,Date.now()).first<{email:string;resource:string;connection_id:string}>();
   if(!row||row.email!==adminEmail()||row.resource!==mediaResource(req))return oauthError('invalid_grant','Kết nối đã hết hạn hoặc bị thu hồi.');
   const used=await db.prepare('DELETE FROM ai_oauth_tokens WHERE refresh_hash=? AND client_id=?').bind(hash,clientId).run();
   if(!used.meta.changes)return oauthError('invalid_grant','Refresh token đã được dùng.');
   return await issueTokens(clientId,row.email,row.resource,row.connection_id);
  }
  return oauthError('unsupported_grant_type','Grant không được hỗ trợ.');
 }catch{return oauthError('server_error','Không cấp được quyền kết nối.',503);}
}
