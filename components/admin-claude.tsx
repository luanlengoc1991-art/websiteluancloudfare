'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {Bot,Loader2,Send,Upload} from 'lucide-react';
import type {MediaTarget} from '@/lib/media-targets';

type LibraryImage={id:string;name:string;url:string};
type Status={targets:MediaTarget[];images:LibraryImage[];mcpUrl:string;providers:Record<'openai'|'claude',{configured:boolean;model:string}>;connections:{id:string;name:string;created_at:number}[];history:{id:string;target_id:string;previous_url:string;new_url:string;source:string;created_at:number}[]};
export default function AdminClaude(){
 const [status,setStatus]=useState<Status|null>(null),[error,setError]=useState(''),[answer,setAnswer]=useState(''),[resultUrl,setResultUrl]=useState('');
 const [provider,setProvider]=useState('direct'),[targetId,setTargetId]=useState(''),[search,setSearch]=useState(''),[command,setCommand]=useState(''),[file,setFile]=useState<File|null>(null),[fileId,setFileId]=useState(''),[preview,setPreview]=useState(''),[busy,setBusy]=useState(false);
 async function reload(){const response=await fetch('/api/admin/media-chat',{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Không đọc được thư viện ảnh.');setStatus(data);}
 useEffect(()=>{reload().catch(e=>setError(e.message));},[]);
 useEffect(()=>{if(!file){setPreview('');return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const submittedForm=event.currentTarget;if(busy)return;setBusy(true);setError('');setAnswer('');setResultUrl('');
  try{
   const form=new FormData();form.set('command',command);form.set('provider',provider);form.set('targetId',targetId);if(file)form.set('file',file);else form.set('fileId',fileId);
   const response=await fetch('/api/admin/media-chat',{method:'POST',body:form}),data=await response.json();
   if(!response.ok)throw Error(data.clarification||data.error||'Không lưu được ảnh.');
   setAnswer(data.text);setResultUrl(data.url);setFile(null);setFileId('');submittedForm.reset();
   if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('alpha-hub-content');channel.postMessage({changed:true});channel.close();}
   await reload().catch(()=>setError('Ảnh đã lưu thành công. Tải lại trang để xem Thư viện mới nhất.'));
  }catch(e){setError(e instanceof Error?e.message:'Không lưu được ảnh.');}finally{setBusy(false);}
 }
 async function revoke(id:string){setBusy(true);setError('');try{const form=new FormData();form.set('operation','revoke');form.set('connectionId',id);const r=await fetch('/api/admin/media-chat',{method:'POST',body:form});if(!r.ok)throw Error('Không thu hồi được kết nối.');await reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const selected=status?.targets.find(t=>t.id===targetId);
 const shown=status?.targets.filter(t=>(t.label+' '+t.id).toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')))||[];
 return <div className="settings-form">
  <div className="settings-card"><h2><Bot size={20}/> Chat quản lý ảnh</h2><p>Đính kèm ảnh, nhập lệnh và chọn nơi cần thay. Ảnh gốc được lưu trong Cloudflare R2, nội dung cập nhật ra website sau khi lưu. Ảnh cũ vẫn còn trong Thư viện.</p>
   {status&&<p className="small muted">ChatGPT: {status.providers.openai.configured?'Đã cấu hình':'Chưa cấu hình'} · Claude: {status.providers.claude.configured?'Đã cấu hình':'Chưa cấu hình'}. Bạn luôn có thể dùng Áp dụng trực tiếp.</p>}
  </div>
  <form className="settings-card" onSubmit={submit}>
   <fieldset disabled={busy||!status} style={{border:0,padding:0,margin:0,minWidth:0}} className="stack">
    <label className="field"><span>Xử lý lệnh</span><select value={provider} onChange={e=>setProvider(e.target.value)}><option value="direct">Áp dụng trực tiếp vào vị trí đã chọn</option><option value="openai">ChatGPT · hiểu câu lệnh</option><option value="claude">Claude · hiểu câu lệnh</option></select></label>
    <label className="field"><span>Tìm vị trí ảnh</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tên dự án, bài viết, mã căn hoặc nền…"/></label>
    <label className="field"><span>Vị trí cần thay {provider==='direct'?'*':'(để AI tự chọn nếu lệnh rõ)'}</span><select required={provider==='direct'} value={targetId} onChange={e=>setTargetId(e.target.value)}><option value="">Chọn vị trí…</option>{selected&&!shown.some(t=>t.id===selected.id)&&<option value={selected.id}>{selected.label}</option>}{shown.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
    {selected?.url&&<div className="field image-field"><span>Ảnh đang dùng</span><img src={selected.url} alt={selected.label}/></div>}
    <label className="field"><span><Upload size={16}/> Ảnh đính kèm · JPG, PNG, WEBP · tối đa 10 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const picked=e.target.files?.[0]||null;if(picked&&picked.size>4*1024*1024){setError('Ảnh tối đa 4 MB.');e.target.value='';setFile(null);return;}setFile(picked);setFileId('');}}/></label>
    {preview&&<div className="image-field"><img src={preview} alt="Ảnh sẽ tải lên"/><small>{file?.name}</small></div>}
    <label className="field"><span>Hoặc dùng lại ảnh đã lưu</span><select value={fileId} onChange={e=>{setFileId(e.target.value);setFile(null);}}><option value="">Chọn từ 50 ảnh mới nhất…</option>{status?.images.map(image=><option key={image.id} value={image.id}>{image.name}</option>)}</select></label>
    <label className="field"><span>Câu lệnh *</span><textarea required rows={4} maxLength={4000} value={command} onChange={e=>setCommand(e.target.value)} placeholder="Ví dụ: Thay ảnh đại diện dự án Vinhomes Green Paradise bằng ảnh đính kèm này."/></label>
    <button className="button dark" type="submit" disabled={!command.trim()||(!file&&!fileId)||(provider==='direct'&&!targetId)}>{busy?<Loader2 size={17}/>:<Send size={17}/>} {busy?'Đang lưu vào Cloudflare…':'Gửi lệnh và cập nhật website'}</button>
   </fieldset>
   {error&&<p role="alert">{error}</p>}{answer&&<p role="status">{answer} {resultUrl&&<a href={resultUrl} target="_blank" rel="noreferrer">Mở ảnh đã lưu</a>}</p>}
  </form>
  <div className="settings-card"><h2>Kết nối ChatGPT và Claude bên ngoài</h2><p>Dùng cùng thư viện và quyền quản trị qua kết nối MCP có đăng nhập. Sau khi kết nối, gửi ảnh và câu lệnh trong ứng dụng đã bật công cụ Alpha HUB.</p>{status&&<label className="field"><span>URL kết nối</span><input readOnly value={status.mcpUrl} onFocus={e=>e.currentTarget.select()}/></label>}
   <p className="small">ChatGPT: bật Developer mode, thêm ứng dụng MCP với OAuth và đăng ký client tự động (DCR). Claude: thêm Custom connector, dùng URL trên, chọn Sign in và Register automatically. Đăng nhập bằng tài khoản quản trị Alpha HUB để kết nối.</p>
   <p className="small muted">ChatGPT nhận file đính kèm qua công cụ publish_chat_image. Với Claude, ứng dụng cần cung cấp link tải ảnh hoặc dữ liệu file thật; nếu phiên chat không cung cấp file cho công cụ, hãy tải ảnh ở khung trên rồi dùng lại ID trong Thư viện. Công cụ không thể đọc đường dẫn file trên máy hoặc ảnh chỉ hiển thị trong chat.</p>
   {status?.connections.map(c=><div className="row" key={c.id}><span>{c.name} · {new Date(c.created_at).toLocaleString('vi-VN')}</span><button type="button" className="button subtle" disabled={busy} onClick={()=>revoke(c.id)}>Thu hồi</button></div>)}
  </div>
  {!!status?.history.length&&<div className="settings-card"><h2>Lịch sử đổi ảnh</h2>{status.history.map(change=><div key={change.id} className="row"><span>{status.targets.find(t=>t.id===change.target_id)?.label||change.target_id} · {new Date(change.created_at).toLocaleString('vi-VN')}</span><a href={change.new_url} target="_blank" rel="noreferrer">Ảnh mới</a>{change.previous_url&&<a href={change.previous_url} target="_blank" rel="noreferrer">Ảnh trước</a>}</div>)}</div>}
 </div>;
}
