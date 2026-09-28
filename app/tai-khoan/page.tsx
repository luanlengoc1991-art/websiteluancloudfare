import {redirect} from 'next/navigation';
import {getSignedInUser} from '@/lib/auth';
export const metadata={title:'Tài khoản của tôi | Alpha HUB'};
export default async function Account(){
 const user=await getSignedInUser();if(!user)redirect('/dang-nhap?return_to=%2Ftai-khoan');
 return <main className="auth-section"><section className="auth-card member-account"><a href="/quy-hang"><img className="auth-logo" src="/alpha-hub-logo.png" alt="Alpha HUB"/></a><span className="member-badge">{user.isAdmin?'QUẢN TRỊ VIÊN':'THÀNH VIÊN ALPHA HUB'}</span><h1>Chào mừng bạn!</h1><p>Bạn đã đăng nhập thành công.</p><div className="member-info"><span>Email tài khoản</span><strong>{user.email}</strong><span>Quyền truy cập</span><strong>{user.isAdmin?'Quản trị website':'Thành viên'}</strong></div><div className="stack"><a className="button dark" href="/du-an">Khám phá dự án</a><a className="button subtle" href="/quy-hang">Xem quỹ căn</a>{user.isAdmin&&<a className="button dark" href="/admin">Vào trang quản trị</a>}<form action="/api/auth/logout" method="post"><button className="button subtle" type="submit">Đăng xuất</button></form></div></section></main>;
}
