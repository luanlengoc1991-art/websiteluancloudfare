/** Check the browser origin against the public Host, including behind an HTTPS proxy. */
export function isSameOrigin(request:Request){
 const origin=request.headers.get('origin');if(!origin)return false;
 try{
  const actual=new URL(origin);
  if(!['http:','https:'].includes(actual.protocol))return false;
  if(process.env.ALPHA_PUBLIC_ORIGIN)return actual.origin===new URL(process.env.ALPHA_PUBLIC_ORIGIN).origin;
  return actual.host===request.headers.get('host');
 }catch{return false;}
}
