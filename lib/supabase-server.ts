/** Server-only Supabase access. Never import from a client component. */
export function supabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Chưa cấu hình kết nối dữ liệu trên máy chủ.');
  return {url: url.replace(/\/$/, ''), key};
}
export async function supabaseFetch(path: string, init: RequestInit = {}) {
  const {url,key} = supabaseConfig();
  const headers = new Headers(init.headers); headers.set('apikey',key);
  if (!key.startsWith('sb_secret_')) headers.set('Authorization',`Bearer ${key}`);
  const response = await fetch(url + path, {...init,headers,cache:'no-store',signal:AbortSignal.timeout(20000)});
  if (!response.ok) { console.error('Supabase request failed',response.status,path.split('?')[0]); throw new Error('Không thể truy cập dữ liệu. Vui lòng thử lại.'); }
  return response;
}
export async function rest(path: string, method='GET', data?: unknown) {
 const r=await supabaseFetch('/rest/v1/'+path,{method,headers:{'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},body:data===undefined?undefined:JSON.stringify(data)});
 return r.status===204?null:r.json();
}
export const eq=(value:unknown)=>'eq.'+encodeURIComponent(String(value));
/** Page through PostgREST's server-side row cap instead of silently losing records. */
export async function readAll(path:string){
 const rows:any[]=[];
 for(let offset=0;;offset+=500){const page=await rest(path+'&limit=500&offset='+offset);rows.push(...page);if(page.length<500)return rows;}
}
