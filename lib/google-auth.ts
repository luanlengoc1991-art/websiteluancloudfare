import {createHash, randomBytes} from 'node:crypto';
import {supabaseConfig} from './supabase-server';

export const oauthCookie = 'alpha_google_pkce';
export function adminEmail() { return (process.env.ALPHA_ADMIN_EMAIL || '').trim().toLowerCase(); }
export function safeReturnTo(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') && !/[\\\x00-\x20]/.test(value) ? value : '/tai-khoan';
}
export function createChallenge() {
  const verifier = randomBytes(32).toString('base64url');
  return {verifier, challenge: createHash('sha256').update(verifier).digest('base64url')};
}
export async function authRequest(path: string, init: RequestInit = {}) {
  const {url, key: serverKey} = supabaseConfig();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || serverKey;
  const headers = new Headers(init.headers);
  headers.set('apikey', key);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(url + '/auth/v1/' + path, {...init, headers, cache: 'no-store', signal: AbortSignal.timeout(15000)});
  if (!response.ok) { const data=await response.json().catch(()=>({})); throw new AuthError(response.status,typeof data.code==='string'?data.code:typeof data.error_code==='string'?data.error_code:'auth_failed'); }
  return response;
}

export class AuthError extends Error {constructor(public status:number,public code:string){super('Authentication unavailable');}}
