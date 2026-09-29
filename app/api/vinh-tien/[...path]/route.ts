import {getCurrentUser} from '@/lib/auth';
import {isSameOrigin} from '@/lib/request-origin';
import {VINH_TIEN_ORIGIN} from '@/lib/green-paradise';
const permitted=(p:string)=>p==='api/state'||p==='api/sheet'||p==='api/assets'||/^(api\/assets|fonts|perspectives|gallery-perspectives|villa-perspectives|amenity-perspectives)\/[a-zA-Z0-9._%-]+$/.test(p)||/^(brand-logo|unit-title|unit-marker|poster-map)\.(png|jpg)$/.test(p);
async function relay(req:Request,context:{params:Promise<{path:string[]}>}){
 const {path}=await context.params;const p=path.join('/');if(!permitted(p)||p.includes('..'))return new Response('Not found',{status:404});
 const write=req.method!=='GET';
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
