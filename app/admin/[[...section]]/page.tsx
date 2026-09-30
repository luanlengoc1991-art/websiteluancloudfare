import {redirect,notFound} from 'next/navigation';
import {getSignedInUser} from '@/lib/auth';
import Hub from '@/components/hub';
export const dynamic='force-dynamic';
export const metadata={title:'Alpha HUB | Quản trị',robots:{index:false,follow:false}};
const sections=['','tong-quan','quan-ly','khach-hang','giao-dich','thu-vien','cau-hinh','quan-ly-du-an','bai-viet','thanh-vien'];
const editorSections=new Set(['quan-ly','thu-vien','quan-ly-du-an','bai-viet']);
export default async function AdminPage({params}:{params:Promise<{section?:string[]}>}){
 const {section=[]}=await params;
 const name=section[0]||'';
 if(section.length>1||!sections.includes(name))notFound();
 const user=await getSignedInUser();
 if(!user?.canEdit)redirect('/dang-nhap?return_to='+encodeURIComponent('/admin/'+section.join('/')));
 if(!user.isAdmin&&!editorSections.has(name))redirect('/admin/quan-ly-du-an');
 return <Hub route={[name||'tong-quan']} adminMode access={user.isAdmin?'admin':'editor'}/>;
}
