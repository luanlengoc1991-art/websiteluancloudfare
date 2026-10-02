'use client';

import {useEffect, useId, useRef, useState, type FormEvent} from 'react';
import {ChevronDown, Send} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from './ui/dialog';
import {usePublicContact} from './public-contact-provider';
import type {Project} from '@/lib/catalog';

type Kind = 'consultation' | 'question' | 'visit';
type Props = {kind: Kind; projects: Project[]};

function ConsentFields() {
  const [policy, setPolicy] = useState<'terms' | 'privacy' | null>(null);
  const contact = usePublicContact();
  return <div className="ah-consents">
    <label><input type="checkbox" name="terms" required/><span>Tôi đã đọc và đồng ý với <button type="button" onClick={() => setPolicy('terms')}>Điều khoản sử dụng</button> của AlphaHub.</span></label>
    <label><input type="checkbox" name="privacy" required/><span>Tôi đã đọc và đồng ý với <button type="button" onClick={() => setPolicy('privacy')}>Thông tin bảo vệ dữ liệu cá nhân</button> của AlphaHub.</span></label>
    <Dialog open={policy !== null} onOpenChange={open => {if (!open) setPolicy(null);}}><DialogContent className="ah-dialog ah-policy-dialog"><DialogHeader><DialogTitle>{policy === 'terms' ? 'Điều khoản sử dụng AlphaHub' : 'Thông tin bảo vệ dữ liệu cá nhân'}</DialogTitle><DialogDescription>{policy === 'terms' ? 'Thông tin cần biết khi tìm hiểu dự án và gửi yêu cầu tư vấn trên AlphaHub.' : 'Cách AlphaHub sử dụng thông tin bạn gửi qua biểu mẫu.'}</DialogDescription></DialogHeader>{policy === 'terms' ? <div className="ah-policy-copy"><p>AlphaHub cung cấp thông tin dự án, hình ảnh và quỹ căn để hỗ trợ việc tìm hiểu bất động sản. Một số dữ liệu đang ở dạng tham khảo hoặc minh họa; giá, chính sách và tình trạng sản phẩm cần được xác nhận trước khi giao dịch.</p><p>Yêu cầu tư vấn và tham quan được gửi đến đội ngũ AlphaHub để liên hệ xác nhận. Việc gửi biểu mẫu không tạo hợp đồng, thu tiền hoặc xác nhận đặt căn với chủ đầu tư.</p></div> : <div className="ah-policy-copy"><p>Họ tên, số điện thoại, email và nội dung yêu cầu được lưu trong hệ thống AlphaHub để đội ngũ tư vấn liên hệ, giải đáp và hỗ trợ bạn. Thông tin liên hệ này không được hiển thị trên các trang công khai.</p><p>Bạn có thể liên hệ AlphaHub để hỏi về hoặc yêu cầu điều chỉnh thông tin đã gửi qua <a href={`tel:${contact.phone}`}>{contact.phone}</a> hoặc <a href={`mailto:${contact.email}`}>{contact.email}</a>.</p></div>}</DialogContent></Dialog>
  </div>;
}

export default function AlphaHubRequestForm({kind, projects}: Props) {
  const prefix = useId();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{text: string; error: boolean} | null>(null);
  const [question, setQuestion] = useState('');
  const [today, setToday] = useState('');
  useEffect(() => {
    const date = new Date();
    setToday(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  }, []);
  const fieldId = (name: string) => `${prefix}-${name}`;
  const nameField = <label className="ah-field" htmlFor={fieldId('name')}><span>Họ và tên <b>*</b></span><input id={fieldId('name')} name="name" placeholder="Nhập họ và tên" autoComplete="name" required minLength={2} maxLength={100}/></label>;
  const phoneField = <label className="ah-field" htmlFor={fieldId('phone')}><span>Số điện thoại <b>*</b></span><input id={fieldId('phone')} name="phone" placeholder="Nhập số điện thoại" autoComplete="tel" type="tel" required minLength={8} maxLength={20}/></label>;
  const emailField = <label className="ah-field" htmlFor={fieldId('email')}><span>Email</span><input id={fieldId('email')} name="email" placeholder="Nhập email" autoComplete="email" type="email" maxLength={254}/></label>;
  const projectField = <label className="ah-field" htmlFor={fieldId('project')}><span>Dự án quan tâm <b>*</b></span><span className="ah-select-wrap"><select id={fieldId('project')} name="project" defaultValue="" required><option value="" disabled>{projects.length ? 'Chọn dự án' : 'Chưa có dự án'}</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><ChevronDown size={17} aria-hidden="true"/></span></label>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) || '').trim();
    const project = projects.find(item => item.id === value('project'));
    if (kind !== 'question' && !project) {setMessage({text: 'Vui lòng chọn dự án bạn quan tâm.', error: true}); return;}
    const note = kind === 'question'
      ? `[AlphaHub · Góc chia sẻ]\nCâu hỏi: ${value('question')}`
      : `[AlphaHub · ${kind === 'visit' ? 'Yêu cầu tham quan' : 'Yêu cầu tư vấn'}]\nDự án: ${project!.name} (${project!.id})${kind === 'visit' ? `\nNgày mong muốn: ${value('date')}\nKhung giờ: ${value('time')}` : ''}`;
    pending.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/leads', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: value('name'), phone: value('phone'), email: value('email'), note, website: value('website')})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Chưa gửi được yêu cầu. Vui lòng thử lại.');
      form.reset();
      setQuestion('');
      setMessage({text: kind === 'visit' ? 'Đã nhận yêu cầu tham quan. AlphaHub sẽ liên hệ xác nhận lịch với bạn.' : kind === 'question' ? 'Đã nhận câu hỏi. AlphaHub sẽ liên hệ giải đáp cho bạn.' : 'Đã nhận yêu cầu tư vấn. AlphaHub sẽ liên hệ với bạn.', error: false});
    } catch (error) {
      setMessage({text: error instanceof Error ? error.message : 'Chưa gửi được yêu cầu. Vui lòng thử lại.', error: true});
    } finally {pending.current = false; setBusy(false);}
  }

  return <form className={`ah-request-form ah-request-${kind}`} aria-label={kind === 'question' ? 'Gửi câu hỏi cho AlphaHub' : kind === 'visit' ? 'Yêu cầu tham quan dự án' : 'Yêu cầu tư vấn dự án'} onSubmit={submit}>
    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" hidden/>
    {kind === 'question' ? <div className="ah-share-fields"><div className="ah-person-fields">{nameField}{phoneField}{emailField}</div><div className="ah-question-fields"><label className="ah-field" htmlFor={fieldId('question')}><span>Nội dung câu hỏi <b>*</b></span><span className="ah-textarea-wrap"><textarea id={fieldId('question')} name="question" placeholder="Nhập nội dung câu hỏi tại đây" value={question} onChange={event => setQuestion(event.target.value)} required minLength={5} maxLength={1000}/><small>{question.length}/1000</small></span></label><ConsentFields/></div></div> : <><div className="ah-form-grid">{projectField}{phoneField}{nameField}{emailField}{kind === 'visit' && <><label className="ah-field" htmlFor={fieldId('date')}><span>Ngày mong muốn <b>*</b></span><input id={fieldId('date')} name="date" type="date" min={today || undefined} required/></label><label className="ah-field" htmlFor={fieldId('time')}><span>Khung giờ <b>*</b></span><span className="ah-select-wrap"><select id={fieldId('time')} name="time" defaultValue="" required><option value="" disabled>Chọn khung giờ</option><option value="Buổi sáng (08:00–12:00)">Buổi sáng (08:00–12:00)</option><option value="Buổi chiều (13:00–17:00)">Buổi chiều (13:00–17:00)</option></select><ChevronDown size={17} aria-hidden="true"/></span></label></>}</div><ConsentFields/></>}
    <div className="ah-submit-row"><button className="ah-button ah-primary" type="submit" disabled={busy || (kind !== 'question' && projects.length === 0)}>{busy ? 'Đang gửi…' : kind === 'question' ? 'Chia sẻ ngay' : kind === 'visit' ? 'Gửi yêu cầu tham quan' : 'Gửi thông tin'}<Send size={17} aria-hidden="true"/></button></div>
    {message && <p className={`ah-form-message ${message.error ? 'is-error' : ''}`} role={message.error ? 'alert' : 'status'}>{message.text}</p>}
  </form>;
}
