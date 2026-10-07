import {getCloudflareContext} from '@opennextjs/cloudflare';
import {getCurrentUser} from '@/lib/auth';
import {isSameOrigin} from '@/lib/request-origin';
import {VINH_TIEN_ORIGIN} from '@/lib/green-paradise';
const permitted=(p:string)=>p==='api/state'||p==='api/sheet'||p==='api/assets'||/^(api\/assets|fonts|perspectives|gallery-perspectives|villa-perspectives|amenity-perspectives)\/[a-zA-Z0-9._%-]+$/.test(p)||/^(brand-logo|unit-title|unit-marker|poster-map)\.(png|jpg)$/.test(p);
const isImage=(p:string)=>/\.(png|jpe?g|webp)$/i.test(p);
type Ctx={env:{IMAGES?:{input(s:ReadableStream):{transform(o:object):{output(o:object):Promise<{response():Response}>}}}};ctx:{waitUntil(p:Promise<unknown>):void}};

/** Static images: edge-cached for a week; ?w= returns a resized WebP thumbnail (Cloudflare Images). */
async function image(req:Request,p:string){
 const cache=(globalThis as unknown as {caches?:{default?:Cache}}).caches?.default;
 const key=new Request(new URL(req.url).toString(),{method:'GET'});
 const hit=await cache?.match(key);if(hit)return hit;
 const r=await fetch(VINH_TIEN_ORIGIN+'/'+p,{signal:AbortSignal.timeout(25000),cf:{cacheEverything:true,cacheTtl:604800}} as RequestInit);
 if(!r.ok||!r.body)return new Response('Not found',{status:r.status===404?404:502});
 const w=Number(new URL(req.url).searchParams.get('w'));const cf=getCloudflareContext() as unknown as Ctx;
 let res:Response;
 if(w>=80&&w<=2400&&cf.env.IMAGES){
  try{res=(await cf.env.IMAGES.input(r.body as unknown as ReadableStream).transform({width:Math.round(w),fit:'scale-down'}).output({format:'image/webp',quality:80})).response();}
  catch{return Response.redirect(new URL(new URL(req.url).pathname,req.url).toString(),302);}
 }else res=new Response(r.body,{headers:{'Content-Type':r.headers.get('content-type')||'application/octet-stream'}});
 res=new Response(res.body,{status:200,headers:{'Content-Type':res.headers.get('content-type')||'image/jpeg','Cache-Control':'public, max-age=604800, stale-while-revalidate=86400'}});
 if(cache)cf.ctx.waitUntil(cache.put(key,res.clone()));
 return res;
}
async function relay(req:Request,context:{params:Promise<{path:string[]}>}){
 const {path}=await context.params;const p=path.join('/');if(!permitted(p)||p.includes('..'))return new Response('Not found',{status:404});
 const write=req.method!=='GET';
 if(!write&&isImage(p)){try{return await image(req,p);}catch{return new Response('Không tải được ảnh.',{status:502});}}
 if(write){if(!isSameOrigin(req))return new Response('Forbidden',{status:403});if(!await getCurrentUser())return Response.json({error:'Đăng nhập tài khoản quản trị để lưu chỉnh sửa.'},{status:401});if(!((req.method==='PUT'&&p==='api/state')||(req.method==='POST'&&p==='api/assets')))return new Response('Method not allowed',{status:405});}
 try{
 const body=write?await req.text():undefined;if(body&&Buffer.byteLength(body)>4*1024*1024)return Response.json({error:'Tệp quá lớn. Tối đa 4 MB mỗi yêu cầu.'},{status:413});
 if(body&&p==='api/state'){const d=JSON.parse(body);if(d.version!==2||!Array.isArray(d.units)||d.units.length>1000)return new Response('Invalid state',{status:400});}
 const r=await fetch(VINH_TIEN_ORIGIN+'/'+p+(p==='api/sheet'?new URL(req.url).search:''),{method:req.method,headers:write?{'Content-Type':'application/json'}:undefined,body,cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!r.ok)return Response.json({error:'Không thể kết nối nguồn Vịnh Tiên.'},{status:502});
 if(p==='api/state'&&!write){const d=await r.json();return Response.json({...d,canEdit:!!await getCurrentUser()},{headers:{'Cache-Control':'private, no-store'}});}
 return new Response(r.body,{status:r.status,headers:{'Content-Type':r.headers.get('content-type')||'application/octet-stream','Cache-Control':p.startsWith('api/state')||p==='api/sheet'?'no-store':'public, max-age=3600'}});
 }catch{return Response.json({error:'Không thể kết nối nguồn Vịnh Tiên. Vui lòng thử lại.'},{status:502});}
}
export const GET=relay;export const PUT=relay;export const POST=relay;
