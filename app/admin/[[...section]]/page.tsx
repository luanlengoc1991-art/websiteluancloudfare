import {redirect,notFound} from 'next/navigation';
import {getSignedInUser} from '@/lib/auth';
export const dynamic='force-dynamic';
export const metadata={title:'Alpha HUB | Quản trị',robots:{index:false,follow:false}};
import {adminSections,editorSections} from '@/lib/site-navigation';
export default async function AdminPage({params}:{params:Promise<{section?:string[]}>}){
 const {section=[]}=await params;
 const name=section[0]||'tong-quan';
 if(section.length>1||!adminSections.has(name))notFound();
 const user=await getSignedInUser();
 if(!user?.canEdit)redirect('/dang-nhap?return_to='+encodeURIComponent('/admin/'+section.join('/')));
 if(!user.isAdmin&&!editorSections.has(name))redirect('/admin/quan-ly-du-an');
 return null;
}
