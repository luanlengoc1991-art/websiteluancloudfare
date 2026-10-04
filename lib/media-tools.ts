import {z} from 'zod';
import {mediaTargets,mediaLibrary,findMediaTarget,attachmentFile,uploadForTarget,applyMedia,attachmentSchema} from '@/lib/media-actions';
import {mediaLimit,MediaError} from '@/lib/media-storage';
const object=(properties:Record<string,unknown>,required:string[]=[])=>({type:'object',properties,required,additionalProperties:false});
const str={type:'string'};
const write={readOnlyHint:false,destructiveHint:true,idempotentHint:false,openWorldHint:false};
const read={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const securitySchemes=[{type:'oauth2',scopes:['media:write']}];
const fileSchema=object({download_url:str,file_id:str,mime_type:str,file_name:str},['download_url','file_id']);
export const mediaTools=[
 {name:'list_image_targets',description:'List editable project covers, article covers, unit posters/layouts, project galleries and page backgrounds. Use exact target IDs; ask when user intent is ambiguous.',inputSchema:object({query:str}),annotations:read},
 {name:'find_library_images',description:'Find original images permanently saved in Cloudflare R2. Reuse these IDs, never invent an image URL.',inputSchema:object({query:str}),annotations:read},
 {name:'publish_chat_image',description:'Save the user-provided image attachment in Cloudflare R2 and publish it to the explicitly requested target. Keep previous images. Only after the user requests that change. Do not claim a code deployment; content is immediately live.',inputSchema:object({target_id:str,file:fileSchema,command:str},['target_id','file','command']),annotations:{...write,openWorldHint:true},_meta:{'openai/fileParams':['file']}},
 {name:'publish_image_base64',description:'For clients with access to actual attached file bytes (e.g. Claude Code): store an original JPG/PNG/WEBP (max 4 MB) and publish to requested target. Never synthesize base64 from visual image contents. If bytes are unavailable ask for an accessible attachment link or use the admin upload.',inputSchema:object({target_id:str,name:str,mime_type:{type:'string',enum:['image/png','image/jpeg','image/webp']},base64:str,command:str},['target_id','name','mime_type','base64','command']),annotations:write},
 {name:'use_library_image',description:'Publish an existing Cloudflare library image at the user-requested target. Keep old images. Supports returning to an earlier image using its file ID.',inputSchema:object({target_id:str,file_id:str,command:str},['target_id','file_id','command']),annotations:write},
].map(t=>({...t,securitySchemes,_meta:{...('_meta' in t?t._meta:{}),securitySchemes}}));
const change=z.object({target_id:z.string().min(1).max(300),command:z.string().trim().min(1).max(4000)});
export async function callMediaTool(name:string,input:unknown,email:string){
 if(name==='list_image_targets'){
  const {query=''}=z.object({query:z.string().max(200).optional()}).parse(input);
  const normal=(v:string)=>v.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  const targets=(await mediaTargets()).filter(t=>!query||normal(t.label+' '+t.id).includes(normal(query)));
  return {targets,count:targets.length};
 }
 if(name==='find_library_images'){const {query=''}=z.object({query:z.string().max(200).optional()}).parse(input);return {images:await mediaLibrary(query)};}
 const params=change.parse(input),target=await findMediaTarget(params.target_id);
 if(name==='publish_chat_image'){
  const {file}=change.extend({file:attachmentSchema}).parse(input);
  return await uploadForTarget(await attachmentFile(file),target,email,'mcp',params.command);
 }
 if(name==='publish_image_base64'){
  const p=change.extend({name:z.string().min(1).max(200),mime_type:z.enum(['image/png','image/jpeg','image/webp']),base64:z.string().min(4).max(Math.ceil(mediaLimit/3)*4)}).parse(input);
  if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(p.base64))throw new MediaError('Base64 không hợp lệ.');
  const bytes=Buffer.from(p.base64,'base64');
  return await uploadForTarget(new File([bytes],p.name,{type:p.mime_type}),target,email,'mcp',p.command);
 }
 if(name==='use_library_image'){const p=change.extend({file_id:z.string().uuid()}).parse(input);return await applyMedia(target,p.file_id,email,'mcp',p.command);}
 throw new MediaError('Công cụ không tồn tại.',404);
}
