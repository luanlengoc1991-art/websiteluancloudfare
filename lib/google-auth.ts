import {createHash,randomBytes} from 'node:crypto';
export {adminEmail} from './auth';

export const oauthCookie='alpha_google_pkce';
export class AuthError extends Error{constructor(public status:number,public code:string){super('Authentication unavailable');}}
/** Google's own OAuth endpoints. Tests point this at a local fixture. */
const endpoints=()=>{
 const base=process.env.GOOGLE_OAUTH_BASE;
 return base?{authorize:base+'/authorize',token:base+'/token'}:{authorize:'https://accounts.google.com/o/oauth2/v2/auth',token:'https://oauth2.googleapis.com/token'};
};
export function googleClient(){
 const id=(process.env.GOOGLE_CLIENT_ID||'').trim(),secret=(process.env.GOOGLE_CLIENT_SECRET||'').trim();
 if(!id||!secret)throw new AuthError(503,'google_disabled');
 return {id,secret};
}
export function safeReturnTo(value:string|null){
 return value&&value.startsWith('/')&&!value.startsWith('//')&&!/[\\\x00-\x20]/.test(value)?value:'/tai-khoan';
}
export function createChallenge(){
 const verifier=randomBytes(32).toString('base64url');
 return {verifier,challenge:createHash('sha256').update(verifier).digest('base64url'),state:randomBytes(16).toString('base64url')};
}
export function authorizeUrl({challenge,state,redirectUri}:{challenge:string;state:string;redirectUri:string}){
 const url=new URL(endpoints().authorize);
 url.searchParams.set('client_id',googleClient().id);
 url.searchParams.set('redirect_uri',redirectUri);
 url.searchParams.set('response_type','code');
 url.searchParams.set('scope','openid email profile');
 url.searchParams.set('code_challenge',challenge);
 url.searchParams.set('code_challenge_method','S256');
 url.searchParams.set('state',state);
 url.searchParams.set('prompt','select_account');
 return url;
}
export async function exchangeCode(code:string,verifier:string,redirectUri:string){
 const {id,secret}=googleClient();
 const response=await fetch(endpoints().token,{
  method:'POST',
  headers:{'Content-Type':'application/x-www-form-urlencoded'},
  cache:'no-store',
  signal:AbortSignal.timeout(15000),
  body:new URLSearchParams({code,client_id:id,client_secret:secret,redirect_uri:redirectUri,grant_type:'authorization_code',code_verifier:verifier})
 });
 if(!response.ok)throw new AuthError(response.status,response.status===429?'rate_limited':'auth_failed');
 const tokens=await response.json() as {id_token?:unknown};
 if(typeof tokens.id_token!=='string')throw new AuthError(502,'auth_failed');
 return tokens.id_token;
}
/**
 * Read the identity Google just returned. The token arrives over TLS from
 * Google's token endpoint in exchange for our client secret, so the claims are
 * authoritative without a second signature check; we still verify that the
 * token was minted for this client and has not expired.
 */
export function readIdentity(idToken:string){
 const parts=idToken.split('.');
 if(parts.length!==3)throw new AuthError(502,'auth_failed');
 let claims:{iss?:unknown;aud?:unknown;exp?:unknown;email?:unknown;email_verified?:unknown;sub?:unknown;name?:unknown};
 try{claims=JSON.parse(Buffer.from(parts[1],'base64url').toString());}catch{throw new AuthError(502,'auth_failed');}
 const issuers=['https://accounts.google.com','accounts.google.com'];
 if(typeof claims.iss!=='string'||!issuers.includes(claims.iss))throw new AuthError(401,'auth_failed');
 if(claims.aud!==googleClient().id)throw new AuthError(401,'auth_failed');
 if(typeof claims.exp!=='number'||claims.exp*1000<=Date.now())throw new AuthError(401,'auth_failed');
 if(typeof claims.sub!=='string'||typeof claims.email!=='string'||claims.email_verified!==true)return null;
 return {id:claims.sub,email:claims.email.trim().toLowerCase(),name:typeof claims.name==='string'?claims.name.slice(0,100):null};
}
