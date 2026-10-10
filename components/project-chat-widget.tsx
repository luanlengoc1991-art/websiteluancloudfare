'use client';
import {useEffect,useRef,useState} from 'react';
import {MessageCircle,Phone,Send,Sparkles,ArrowUpRight,Building2,Headphones} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import ContactForm from './contact-form';
import Link from './site-link';
import {projectPath,unitPlanPath} from '@/lib/project-routes';
import {classifyCustomerMessage,normalizeCustomerMessage} from '@/lib/customer-care';
import {buildKnowledge} from '@/lib/chat-knowledge';
import {usePublicContact} from './public-contact-provider';
import type {Article,Project,Unit} from '@/lib/catalog';
import type {AboutContent,Guide} from '@/lib/site-content';
type Reply={role:'user'|'assistant';text:string;links?:{label:string;href:string}[];local?:boolean};
const normalize=normalizeCustomerMessage;
const money=(n:number)=>n.toLocaleString('vi-VN',{maximumFractionDigits:3});
const greeting='Chào bạn! Tôi là trợ lý Alpha HUB. Bạn có thể hỏi về bất kỳ dự án nào trên website: vị trí, tiện ích, phân khu, chính sách, mã căn, giá, căn còn hàng theo ngân sách… Tôi trả lời theo dữ liệu đang có trên website.';
export default function ProjectChatWidget({projects,units,projectId,statusOf,articles=[],about,guides=[]}:{projects:Project[];units:Unit[];projectId?:string;statusOf:(u:Unit)=>string;articles?:Article[];about?:AboutContent;guides?:Guide[]}){
 const publicContact=usePublicContact();
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(projectId||''),[input,setInput]=useState(''),[contact,setContact]=useState(false),[busy,setBusy]=useState(false);
 const [messages,setMessages]=useState<Reply[]>([{role:'assistant',text:greeting}]);
 const bottom=useRef<HTMLDivElement>(null);const phone=publicContact.phone;const digits=phone.replace(/\D/g,'');const hasPhone=digits.length>=8&&digits.length<=15;const chosen=projects.find(p=>p.id===selected);
 useEffect(()=>{if(projectId)setSelected(projectId);},[projectId]);
 useEffect(()=>{if(open)bottom.current?.scrollIntoView({block:'nearest'});},[messages,open,contact,busy]);
 /** Built-in lookup, used when the AI is not configured or unavailable. */
 const localAnswer=(text:string):Reply=>{
  const q=normalize(text);let scope=chosen;
  const direct=projects.find(p=>q.includes(normalize(p.name))||q.includes(normalize(p.id).replaceAll('-',' ')));if(direct)scope=direct;
  const exact=units.find(u=>q.includes(normalize(u.code)));
  if(exact){const p=projects.find(p=>p.id===exact.projectId);return {role:'assistant',text:`${exact.code} · ${p?.name||''}\n${exact.type} · ${money(exact.area)} m² · ${exact.direction}\nGiá tham khảo: ${money(exact.price)} tỷ. Trạng thái trên website: ${statusOf(exact)}.`,links:[{label:'Xem mặt bằng căn',href:unitPlanPath(exact)}]};}
  if(classifyCustomerMessage(text)==='contact')return {role:'assistant',text:`Bạn có thể gọi ${phone}, mở Zalo, gửi email hoặc nhắn Facebook. Bạn cũng có thể để lại thông tin bên dưới để được tư vấn.`};
  if(scope){const all=units.filter(u=>u.projectId===scope.id);const budget=q.match(/(?:duoi|toi da|tam|khoang|ngan sach)\s*(\d+(?:[.,]\d+)?)\s*(?:ty|ti)/);const max=budget?Number(budget[1].replace(',','.')):null;const available=all.filter(u=>statusOf(u)==='Còn hàng'&&(max===null||u.price<=max));const prices=all.map(u=>u.price).filter(n=>n>0);return {role:'assistant',text:`${scope.name}\n${scope.location}\nWebsite có ${all.length} căn, ${all.filter(u=>statusOf(u)==='Còn hàng').length} căn đang hiển thị còn hàng.${prices.length?` Giá tham khảo từ ${money(Math.min(...prices))} đến ${money(Math.max(...prices))} tỷ.`:''}${max!==null?`\nCó ${available.length} căn còn hàng với giá không quá ${money(max)} tỷ.`:''}\nGiá và trạng thái cần xác nhận lại với tư vấn viên.`,links:[{label:'Mở bảng hàng dự án',href:projectPath(scope.id,'inventory')},...available.slice(0,3).map(u=>({label:`${u.code} · ${money(u.price)} tỷ`,href:unitPlanPath(u)}))]};}
  const words=q.split(/\s+/).filter(w=>w.length>2&&!['xem','gia','can','tim','cho','toi','bao','nhieu','duoi','tren'].includes(w));const matching=projects.filter(p=>words.some(w=>normalize(p.name+' '+p.location).includes(w)));const options=matching.length?matching:projects.slice(0,4);
  return {role:'assistant',text:'Hãy chọn dự án phía trên để tra giá và quỹ căn, hoặc nhập mã căn cụ thể. Một số dự án bạn có thể xem:',links:options.slice(0,5).map(p=>({label:`${p.name} · ${units.filter(u=>u.projectId===p.id).length} căn`,href:projectPath(p.id,'inventory')}))};
 };
 /** Quick links for unit codes and projects named in an AI answer. */
 const linksFor=(answer:string)=>{
  const a=normalize(answer),links:{label:string;href:string}[]=[];
  for(const u of units)if(links.length<4&&u.code.length>2&&new RegExp(`(^|[^a-z0-9])${normalize(u.code).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z0-9]|$)`).test(a)&&!links.some(l=>l.href===unitPlanPath(u)))links.push({label:`${u.code} · ${u.price?money(u.price)+' tỷ':'Liên hệ'}`,href:unitPlanPath(u)});
  for(const p of projects)if(links.length<5&&a.includes(normalize(p.name)))links.push({label:`Dự án ${p.name}`,href:projectPath(p.id)});
  return links;
 };
 const reply=async(question:string)=>{
  const text=question.trim().slice(0,500);if(!text||busy)return;setInput('');setContact(false);
  const direct=projects.find(p=>normalize(text).includes(normalize(p.name)));if(direct)setSelected(direct.id);
  const history=messages.slice(1).filter(m=>!m.local).slice(-10).map(m=>({role:m.role,text:m.text}));
  setMessages(prev=>[...prev.slice(-28),{role:'user',text}]);
  if(classifyCustomerMessage(text)==='sensitive'){setContact(true);setMessages(prev=>[...prev,{role:'assistant',local:true,text:'Yêu cầu này cần tư vấn viên xử lý trực tiếp. Trợ lý không tự cam kết giảm giá, hoàn tiền, đặt cọc, hợp đồng hoặc kết quả giao dịch. Bạn có thể để lại thông tin bên dưới để chủ sở hữu liên hệ và xác nhận.'}]);return;}
  if(classifyCustomerMessage(text)==='contact')setContact(true);
  setBusy(true);let answer:Reply;
  try{
   const knowledge=buildKnowledge({projects,units,statusOf,articles,about:about||{} as AboutContent,guides,contact:publicContact,question:[...history.map(h=>h.text),text].join(' '),projectId:direct?.id||selected||undefined});
   const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:text,knowledge,history})});
   const data=await res.json().catch(()=>({}));
   if(res.ok&&data.answer)answer={role:'assistant',text:data.answer,links:linksFor(data.answer)};
   else if(res.status===429)answer={role:'assistant',local:true,text:data.error};
   else answer={...localAnswer(text),local:true};
  }catch{answer={...localAnswer(text),local:true};}
  setBusy(false);setMessages(prev=>[...prev,answer]);
 };
 const missingContact=()=>{setOpen(true);setContact(true);};
 return <><div className="project-contact-dock" aria-label="Liên hệ và tư vấn"><button className="dock-chat" onClick={()=>setOpen(true)} aria-label="Mở chatbot dự án" title="Chatbot dự án"><MessageCircle size={26}/><i/></button>{hasPhone?<a className="dock-zalo" href={'https://zalo.me/'+digits} target="_blank" rel="noreferrer" aria-label="Liên hệ Zalo" title="Chat Zalo">Zalo</a>:<button className="dock-zalo" onClick={missingContact} aria-label="Liên hệ Zalo" title="Liên hệ Zalo">Zalo</button>}{hasPhone?<a className="dock-phone" href={'tel:+'+(digits.startsWith('0')?'84'+digits.slice(1):digits)} aria-label={`Gọi hotline ${phone}`} title={phone}><Phone size={23}/></a>:<button className="dock-phone" onClick={missingContact} aria-label="Gọi hotline" title="Hotline"><Phone size={23}/></button>}</div>
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="project-chat-panel"><header className="project-chat-header"><span className="chat-avatar"><Sparkles size={24}/></span><div><DialogTitle>Trợ lý dự án Alpha HUB</DialogTitle><DialogDescription>Hỏi đáp dự án · Tra cứu mã căn · Kết nối tư vấn</DialogDescription></div></header><div className="project-chat-selector"><Building2 size={17}/><select aria-label="Dự án cần tư vấn" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Chọn dự án bạn quan tâm</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="project-chat-messages" role="log" aria-live="polite" aria-label="Nội dung trò chuyện">{messages.map((m,i)=><div className={'chat-message '+m.role} key={i}><p>{m.text}</p>{m.links&&m.links.length>0&&<div className="chat-result-links">{m.links.map(l=><Link key={l.href} href={l.href}>{l.label}<ArrowUpRight size={14}/></Link>)}</div>}</div>)}{busy&&<div className="chat-message assistant is-typing"><p><span className="chat-typing"><i/><i/><i/></span>Đang tra cứu dữ liệu…</p></div>}{contact&&<div className="chat-contact-form"><h3><Headphones size={17}/>Yêu cầu tư vấn</h3><p>Hotline/Zalo: {phone}<br/>Email: {publicContact.email}</p><div className="chat-direct-links"><a href={'tel:'+phone}>Gọi Hotline</a><a href={publicContact.zaloHref} target="_blank" rel="noreferrer">Mở Zalo</a><a href={'mailto:'+publicContact.email}>Gửi email</a><a href={publicContact.facebookHref} target="_blank" rel="noreferrer">Facebook</a></div><ContactForm note={chosen?`Yêu cầu từ chatbot: ${chosen.name}`:'Yêu cầu tư vấn từ chatbot dự án'}/></div>}<div ref={bottom}/></div><div className="project-chat-quick">{(chosen?[`Tổng quan ${chosen.name}`,'Căn còn hàng giá tốt','Tiện ích & vị trí','Liên hệ tư vấn']:['Có những dự án nào?','Căn dưới 10 tỷ','Liên hệ tư vấn']).map(q=><button key={q} disabled={busy} onClick={()=>reply(q)}>{q}</button>)}</div><form className="project-chat-compose" onSubmit={e=>{e.preventDefault();reply(input);}}><input aria-label="Câu hỏi cho chatbot" placeholder={chosen?'Hỏi về dự án, mã căn, giá, tiện ích…':'Nhập câu hỏi, tên dự án hoặc mã căn…'} value={input} onChange={e=>setInput(e.target.value)} maxLength={500}/><button type="submit" disabled={!input.trim()||busy} aria-label="Gửi câu hỏi"><Send size={19}/></button></form><p className="project-chat-footnote">Trợ lý AI trả lời theo dữ liệu website · Giá, trạng thái cần xác nhận với tư vấn viên.</p></DialogContent></Dialog></>;
}
