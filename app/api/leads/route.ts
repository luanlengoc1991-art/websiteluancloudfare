import {createHash} from 'node:crypto';
import {z} from 'zod';
import {isSameOrigin} from '@/lib/request-origin';
import {rest} from '@/lib/supabase-server';
const schema=z.object({name:z.string().trim().min(2).max(100),phone:z.string().regex(/^[+\d ()-]{8,20}$/),email:z.union([z.literal(''),z.string().email().max(254)]).default(''),note:z.string().max(2000).default(''),website:z.string().max(0).optional()});
export async function POST(req:Request){
 if(!isSameOrigin(req))return Response.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 if(Number(req.headers.get('content-length')||0)>10000)return Response.json({error:'Yêu cầu quá lớn.'},{status:413});
 try{
  const text=await req.text();if(text.length>10000)return Response.json({error:'Yêu cầu quá lớn.'},{status:413});
  const data=schema.parse(JSON.parse(text));const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();
  const allowed=await rest('rpc/alpha_login_attempt','POST',{p_id:'lead:'+createHash('sha256').update(ip).digest('hex'),p_now:Date.now()});
  if(!allowed)return Response.json({error:'Bạn đã gửi nhiều yêu cầu. Vui lòng thử lại sau 15 phút.'},{status:429});
  const id=crypto.randomUUID();await rest('alpha_records','POST',{owner:'admin',kind:'customer',id,payload:JSON.stringify({id,name:data.name,phone:data.phone,email:data.email,note:'Đăng ký từ website. '+data.note,stage:'Mới'}),updated:Date.now()});
  return Response.json({ok:true},{status:201});
 }catch(e){if(e instanceof z.ZodError||e instanceof SyntaxError)return Response.json({error:'Vui lòng kiểm tra họ tên, số điện thoại và email.'},{status:400});console.error(e);return Response.json({error:'Chưa gửi được yêu cầu. Vui lòng thử lại.'},{status:503});}
}
