'use client';
import {useEffect,useState,type FormEvent} from 'react';
const messages:Record<string,string>={
 google_disabled:'Đăng nhập Google đang tạm thời chưa khả dụng.',
 google_unavailable:'Không thể kết nối Google. Vui lòng thử lại.',
 google_cancelled:'Xác thực chưa hoàn tất. Bạn có thể đăng nhập lại.',
 google_expired:'Liên kết đã hết hạn hoặc được mở trên trình duyệt khác. Hãy thử đăng nhập.',
 google_forbidden:'Email chưa được xác thực. Vui lòng xác nhận email hoặc thử lại bằng Google.',
 google_failed:'Không thể hoàn tất xác thực. Vui lòng thử đăng nhập lại.',
};
export default function LoginForm({mode='login'}:{mode?:'login'|'signup'}){
 const signup=mode==='signup';
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[googleBusy,setGoogleBusy]=useState(false),[visible,setVisible]=useState(false);
 const [target,setTarget]=useState('/tai-khoan');
 useEffect(()=>{const params=new URLSearchParams(window.location.search);setError(messages[params.get('error')||'']||'');setTarget(params.get('return_to')||'/tai-khoan');},[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget,data=new FormData(form);setError('');setMessage('');
  if(signup&&data.get('password')!==data.get('confirmation')){setError('Mật khẩu nhập lại chưa khớp.');return;}
  setBusy(true);
  try{
   const response=await fetch('/api/auth/'+(signup?'signup':'login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:data.get('email'),password:data.get('password'),name:data.get('name')})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Không thể xử lý. Vui lòng thử lại.');
   if(result.redirect){window.location.assign('/tai-khoan');return;}
   setMessage(result.message);form.reset();
  }catch(e){setError(e instanceof Error?e.message:'Kết nối gián đoạn. Vui lòng thử lại.');}finally{setBusy(false);}
 }
 return <div className="member-auth">
  <nav className="auth-tabs" aria-label="Tài khoản"><a href="/dang-nhap" aria-current={!signup?'page':undefined}>Đăng nhập</a><a href="/dang-ky" aria-current={signup?'page':undefined}>Đăng ký</a></nav>
  <form action={'/api/auth/google?return_to='+encodeURIComponent(target)} method="post" onSubmit={()=>setGoogleBusy(true)}>
   <button className="button google-button" type="submit" disabled={busy||googleBusy}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.61 4.61 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.38Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.39l-3.24-2.52c-.9.6-2.06.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.05v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.94a6 6 0 0 1 0-3.88v-2.6H3.05a10 10 0 0 0 0 9.08l3.35-2.6Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.46l3.35 2.6A5.98 5.98 0 0 1 12 5.94Z"/></svg>{googleBusy?'Đang chuyển đến Google…':signup?'Đăng ký bằng Google':'Tiếp tục với Google'}</button>
  </form>
  <div className="auth-divider"><span>hoặc sử dụng email</span></div>
  <form className="stack" onSubmit={submit} aria-busy={busy}>
   {signup&&<label className="field"><span>Họ và tên</span><input name="name" autoComplete="name" placeholder="Nhập họ và tên" maxLength={100} required/></label>}
   <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="ban@example.com" maxLength={254} required/></label>
   <label className="field"><span>Mật khẩu</span><div className="auth-password"><input name="password" type={visible?'text':'password'} autoComplete={signup?'new-password':'current-password'} placeholder={signup?'Tối thiểu 8 ký tự':'Nhập mật khẩu'} minLength={signup?8:1} maxLength={128} required/><button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?'Ẩn mật khẩu':'Hiện mật khẩu'} aria-pressed={visible}>{visible?'Ẩn':'Hiện'}</button></div></label>
   {signup&&<label className="field"><span>Nhập lại mật khẩu</span><input name="confirmation" type={visible?'text':'password'} autoComplete="new-password" placeholder="Nhập lại mật khẩu" minLength={8} maxLength={128} required/></label>}
   {error&&<div className="auth-notice error" role="alert">{error}</div>}
   {message&&<div className="auth-notice success" role="status">{message}</div>}
   <button className="button dark auth-submit" type="submit" disabled={busy||googleBusy}>{busy?'Đang xử lý…':signup?'Tạo tài khoản':'Đăng nhập'}</button>
  </form>
  <p className="auth-switch">{signup?'Đã có tài khoản?':'Chưa có tài khoản?'} <a href={signup?'/dang-nhap':'/dang-ky'}>{signup?'Đăng nhập':'Đăng ký ngay'}</a></p>
  <p className="small muted">Dùng Google lần đầu sẽ tự tạo tài khoản thành viên. Không nhập mật khẩu Gmail vào biểu mẫu này.</p>
 </div>;
}
