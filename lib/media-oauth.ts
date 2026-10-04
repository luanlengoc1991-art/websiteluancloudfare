import {randomBytes, createHash} from 'node:crypto';
import {database} from '@/db/store';
import {adminEmail, tokenHash} from '@/lib/auth';
export const mediaScope = 'media:write';
export const publicOrigin = (req: Request) => new URL(process.env.ALPHA_PUBLIC_ORIGIN || req.url).origin;
export const mediaResource = (req: Request) => publicOrigin(req) + '/api/mcp';
export const opaque = () => randomBytes(32).toString('base64url');
export const pkce = (value:string) => createHash('sha256').update(value).digest('base64url');
export const oauthError = (error:string, description:string, status=400) => Response.json({error,error_description:description},{status,headers:{'Cache-Control':'no-store'}});
export function allowedRedirect(value:string, req:Request) {
  try {
    const url=new URL(value);
    if(url.username||url.password||url.hash)return false;
    if(url.protocol==='https:'&&['chatgpt.com','chat.openai.com','claude.ai','claude.com'].includes(url.hostname)&&(!url.port||url.port==='443'))return true;
    // Disposable local Worker tests only; production never permits HTTP callbacks.
    return url.origin===publicOrigin(req)&&new URL(publicOrigin(req)).hostname==='127.0.0.1'&&url.protocol==='http:';
  } catch { return false; }
}
export async function authorizeParams(params:URLSearchParams, req:Request) {
  const client=await database().prepare('SELECT id,name,redirect_uris FROM ai_oauth_clients WHERE id=? AND expires>?').bind(params.get('client_id'),Date.now()).first<{id:string;name:string;redirect_uris:string}>();
  if(!client||!JSON.parse(client.redirect_uris).includes(params.get('redirect_uri'))||!allowedRedirect(params.get('redirect_uri') || '',req))throw new Error('Ứng dụng hoặc callback không hợp lệ.');
  if(params.get('response_type')!=='code'||params.get('code_challenge_method')!=='S256'||!/^[A-Za-z0-9_-]{43}$/.test(params.get('code_challenge') || '')||params.get('resource')!==mediaResource(req)||params.get('scope')!==mediaScope||!params.get('state')||params.get('state')!.length>1000)throw new Error('Yêu cầu OAuth cần resource, scope media:write, state và PKCE S256.');
  return client;
}
export async function issueTokens(clientId:string,email:string,resource:string,connectionId?:string) {
  const access=opaque(),refresh=opaque(),now=Date.now(),connection=connectionId || crypto.randomUUID(),db=database();
  const statements=[];
  if(!connectionId)statements.push(db.prepare('INSERT INTO ai_oauth_connections(id,client_id,email,created_at,expires) VALUES(?,?,?,?,?)').bind(connection,clientId,email,now,now+30*86400000));
  statements.push(db.prepare("INSERT INTO ai_oauth_tokens(connection_id,hash,refresh_hash,client_id,email,resource,expires,refresh_expires,created_at) SELECT ?,?,?,?,?,?,MIN(?,expires),expires,? FROM ai_oauth_connections WHERE id=? AND client_id=? AND email=? AND revoked=0 AND expires>?").bind(connection,tokenHash(access),tokenHash(refresh),clientId,email,resource,now+3600000,now,connection,clientId,email,now));
  const result=await db.batch(statements);
  if(!result.at(-1)?.meta.changes)return oauthError('invalid_grant','Kết nối đã bị thu hồi.');
  return Response.json({access_token:access,refresh_token:refresh,token_type:'Bearer',expires_in:3600,scope:mediaScope},{headers:{'Cache-Control':'no-store','Pragma':'no-cache'}});
}
export async function mcpIdentity(req:Request) {
  const match=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.get('authorization') || '');
  if(!match)return null;
  const row=await database().prepare('SELECT t.email,t.client_id FROM ai_oauth_tokens t JOIN ai_oauth_connections c ON c.id=t.connection_id WHERE t.hash=? AND t.resource=? AND t.expires>? AND c.revoked=0 AND c.expires>?').bind(tokenHash(match[1]),mediaResource(req),Date.now(),Date.now()).first<{email:string;client_id:string}>();
  return row?.email===adminEmail()?row:null;
}
export function authChallenge(req:Request) {
  return Response.json({error:'Đăng nhập quản trị để kết nối công cụ ảnh.'},{status:401,headers:{'Cache-Control':'no-store','WWW-Authenticate':`Bearer resource_metadata="${publicOrigin(req)}/.well-known/oauth-protected-resource/api/mcp", scope="${mediaScope}"`}});
}
