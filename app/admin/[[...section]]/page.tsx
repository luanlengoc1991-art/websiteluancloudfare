import {redirect,notFound} from 'next/navigation';
import {getCurrentUser} from '@/lib/auth';
import Hub from '@/components/hub';
export const dynamic='force-dynamic';
export const metadata={title:'Alpha HUB | Quản trị',robots:{index:false,follow:false}};
export default async function AdminPage({params}:{params:Promise<{section?:string[]}>}){
 const {section=[]}=await params;
 if(section.length>1||!['','tong-quan','quan-ly','khach-hang','giao-dich','thu-vien','cau-hinh','quan-ly-du-an','bai-viet'].includes(section[0]||''))notFound();
 if(!await getCurrentUser())redirect('/dang-nhap?return_to='+encodeURIComponent('/admin/'+section.join('/')));
 return <Hub route={[section[0]||'tong-quan']} adminMode/>;
}
