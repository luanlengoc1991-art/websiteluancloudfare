import {getCloudflareContext} from '@opennextjs/cloudflare';
import {getCurrentUser} from '@/lib/auth';
import {isSameOrigin} from '@/lib/request-origin';
import {MediaError, mediaFailure, storeMedia} from '@/lib/media-storage';
import {readVinhTienSheet, readVinhTienState, vinhTienImage, writeVinhTienState} from '@/lib/vinh-tien-store';
const permitted=(p:string)=>p==='api/state'||p==='api/sheet'||p==='api/assets'||/^(api\/assets|fonts|perspectives|gallery-perspectives|villa-perspectives|amenity-perspectives)\/[a-zA-Z0-9._%-]+$/.test(p)||/^(brand-logo|unit-title|unit-marker|poster-map)\.(png|jpg)$/.test(p);
const isStatic=(p:string)=>!['api/state','api/sheet','api/assets'].includes(p);
type Ctx={env:{IMAGES?:{input(s:ReadableStream):{transform(o:object):{output(o:object):Promise<{response():Response}>}}}};ctx:{waitUntil(p:Promise<unknown>):void}};

/** Static images (R2 mirror, edge-cached a week); ?w= returns a resized WebP via Cloudflare Images. */
async function image(req:Request,p:string){
 const cache=(globalThis as unknown as {caches?:{default?:Cache}}).caches?.default;
 const key=new Request(new URL(req.url).toString(),{method:'GET'});
 const hit=await cache?.match(key);if(hit)return hit;
 const src=await vinhTienImage(p);if(!src)return new Response('Not found',{status:404});
 const w=Number(new URL(req.url).searchParams.get('w'));const cf=getCloudflareContext() as unknown as Ctx;
 let body:BodyInit=src.body as BodyInit,type=src.type;
 if(w>=80&&w<=2560&&cf.env.IMAGES&&/^image\/(png|jpe?g|webp)/.test(type)){
  try{const stream=src.body instanceof ArrayBuffer?new Blob([src.body]).stream():src.body;const out=(await cf.env.IMAGES.input(stream as unknown as ReadableStream).transform({width:Math.round(w),fit:'scale-down'}).output({format:'image/webp',quality:84})).response();body=out.body as BodyInit;type='image/webp';}
  catch{return Response.redirect(new URL(new URL(req.url).pathname,req.url).toString(),302);}
 }
 const res=new Response(body,{headers:{'Content-Type':type,'Cache-Control':'public, max-age=604800, stale-while-revalidate=86400'}});
 if(cache)cf.ctx.waitUntil(cache.put(key,res.clone()));
 return res;
}

/** Studio uploads go to the owner's R2 (compressed, listed in the admin library) instead of the old app. */
async function upload(req:Request){
 const d=await req.json() as {dataUrl?:string;name?:string};
 const m=/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/.exec(d.dataUrl||'');if(!m)throw new MediaError('Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
 const bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));
 const saved=await storeMedia(new File([bytes],(d.name||'anh-mat-bang-can').slice(0,200),{type:m[1]}),'site-library','image',true);
 return Response.json({key:saved.id,url:saved.url,name:saved.name},{headers:{'Cache-Control':'no-store'}});
}

async function relay(req:Request,context:{params:Promise<{path:string[]}>}){
 const {path}=await context.params;const p=path.join('/');if(!permitted(p)||p.includes('..'))return new Response('Not found',{status:404});
 const write=req.method!=='GET';
 if(!write&&isStatic(p)){try{return await image(req,p);}catch{return new Response('Không tải được ảnh.',{status:502});}}
 if(write){
  if(!isSameOrigin(req))return new Response('Forbidden',{status:403});
  if(!await getCurrentUser())return Response.json({error:'Đăng nhập tài khoản quản trị để lưu chỉnh sửa.'},{status:401});
  if(!((req.method==='PUT'&&p==='api/state')||(req.method==='POST'&&p==='api/assets')))return new Response('Method not allowed',{status:405});
  if(Number(req.headers.get('content-length')||0)>14*1024*1024)return Response.json({error:'Tệp quá lớn. Tối đa 10 MB mỗi ảnh.'},{status:413});
 }
 try{
  if(p==='api/assets')return await upload(req);
  if(p==='api/state'&&write){const d=await req.json() as {version?:number;units?:unknown[]};if(d.version!==2||!Array.isArray(d.units)||d.units.length>1000)return new Response('Invalid state',{status:400});return Response.json(await writeVinhTienState(d),{headers:{'Cache-Control':'no-store'}});}
  if(p==='api/state')return Response.json({...await readVinhTienState(),canEdit:!!await getCurrentUser()},{headers:{'Cache-Control':'private, no-store'}});
  return Response.json(await readVinhTienSheet(new URL(req.url).search),{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(e instanceof MediaError)return mediaFailure(e);return Response.json({error:'Không thể tải dữ liệu Mặt bằng căn. Vui lòng thử lại.'},{status:502});}
}
export const GET=relay;export const PUT=relay;export const POST=relay;
