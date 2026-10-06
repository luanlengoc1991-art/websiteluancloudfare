import {getCurrentUser} from '@/lib/auth';
import {isSameOrigin} from '@/lib/request-origin';
import {database} from '@/db/store';
import {mediaTargets,findMediaTarget,uploadForTarget,applyMedia,mediaLibrary} from '@/lib/media-actions';
import {mediaFailure,MediaError,mediaLimit} from '@/lib/media-storage';
import {mediaModels,resolveMediaCommand} from '@/lib/media-ai';
import {publicOrigin} from '@/lib/media-oauth';
export async function GET(req:Request){
 if(!await getCurrentUser())return Response.json({error:'Chỉ quản trị được dùng chat ảnh.'},{status:401});
 const db=database();
 await db.prepare('DELETE FROM ai_oauth_tokens WHERE refresh_expires<=?').bind(Date.now()).run();
 const [targets,images,history,connections]=await Promise.all([mediaTargets(),mediaLibrary(),db.prepare('SELECT id,target_id,file_id,previous_url,new_url,source,created_at FROM media_changes ORDER BY created_at DESC LIMIT 30').all(),db.prepare('SELECT t.id,c.name,t.created_at,t.expires FROM ai_oauth_connections t JOIN ai_oauth_clients c ON c.id=t.client_id WHERE t.expires>? AND t.revoked=0').bind(Date.now()).all()]);
 return Response.json({targets,images,history:history.results,connections:connections.results,mcpUrl:publicOrigin(req)+'/api/mcp',providers:{openai:{configured:Boolean(process.env.OPENAI_API_KEY?.trim()),model:mediaModels.openai()},claude:{configured:Boolean(process.env.ANTHROPIC_API_KEY?.trim()),model:mediaModels.claude()}}},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:Request){
 try{
  if(!isSameOrigin(req))return Response.json({error:'Yêu cầu không hợp lệ.'},{status:403});
  const admin=await getCurrentUser();if(!admin)return Response.json({error:'Chỉ quản trị được dùng chat ảnh.'},{status:401});
  if(Number(req.headers.get('content-length')||0)>mediaLimit+256*1024)return Response.json({error:'Ảnh tối đa 10 MB.'},{status:413});
  const form=await req.formData(),operation=form.get('operation');
  if(operation==='revoke'){
   const id=String(form.get('connectionId')||'');if(!/^[a-f0-9-]{36}$/.test(id))throw new MediaError('Kết nối không hợp lệ.');
   const db=database();await db.batch([db.prepare('UPDATE ai_oauth_connections SET revoked=1 WHERE id=? AND email=?').bind(id,admin.email),db.prepare('DELETE FROM ai_oauth_tokens WHERE connection_id=? AND email=?').bind(id,admin.email)]);return Response.json({ok:true});
  }
  const command=String(form.get('command')||'').trim(),provider=String(form.get('provider')||'direct'),selected=String(form.get('targetId')||'');
  if(!command||command.length>4000)throw new MediaError('Nhập lệnh từ 1 đến 4.000 ký tự.');
  if(!['direct','openai','claude'].includes(provider))throw new MediaError('Chọn ChatGPT, Claude hoặc Áp dụng trực tiếp.');
  let targetId=selected;
  if(provider!=='direct'){
   const resolution=await resolveMediaCommand(provider as 'openai'|'claude',command,await mediaTargets(),selected);
   if(!resolution.targetId)return Response.json({ok:false,clarification:resolution.explanation},{status:422});
   targetId=resolution.targetId;
  }
  const target=await findMediaTarget(targetId),file=form.get('file'),fileId=String(form.get('fileId')||'');
  const result=file instanceof File&&file.size?await uploadForTarget(file,target,admin.email,provider,command):await applyMedia(target,fileId,admin.email,provider,command);
  return Response.json({...result,text:`Đã lưu ảnh vào Cloudflare và cập nhật ${target.label}. Ảnh cũ vẫn còn trong Thư viện.`},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return mediaFailure(error);}
}
