import {mcpIdentity,authChallenge,publicOrigin} from '@/lib/media-oauth';
import {mediaTools,callMediaTool} from '@/lib/media-tools';
const versions=['2025-06-18','2025-03-26','2025-11-25'];
function originAllowed(req:Request){const origin=req.headers.get('origin');return !origin||[publicOrigin(req),'https://chatgpt.com','https://claude.ai','https://claude.com'].includes(origin);}
export async function POST(req:Request){
 if(!originAllowed(req))return new Response(null,{status:403});
 const identity=await mcpIdentity(req);if(!identity)return authChallenge(req);
 if(Number(req.headers.get('content-length')||0)>6*1024*1024)return new Response(null,{status:413});
 const version=req.headers.get('mcp-protocol-version');if(version&&!versions.includes(version))return new Response(null,{status:400});
 let body:any;try{body=await req.json();}catch{return Response.json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON'}},{status:400});}
 if(!body||Array.isArray(body)||body.jsonrpc!=='2.0'||typeof body.method!=='string')return Response.json({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Invalid Request'}},{status:400});
 if(body.id===undefined){if(body.method==='notifications/initialized')return new Response(null,{status:202});return new Response(null,{status:400});}
 const reply=(result:unknown)=>Response.json({jsonrpc:'2.0',id:body.id,result},{headers:{'Cache-Control':'no-store'}});
 if(body.method==='initialize')return reply({protocolVersion:versions.includes(body.params?.protocolVersion)?body.params.protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'Alpha HUB media',version:'1.0.0'},instructions:'Manage only website images authorized by the administrator. List targets and resolve the exact position first. Attached images must be real file bytes or a usable attachment URL. Save into R2 then update the content in D1. Previous images remain in the library. Never invent URLs or claim deployments. Content updates are immediately available on the public site.'});
 if(body.method==='ping')return reply({});
 if(body.method==='tools/list')return reply({tools:mediaTools});
 if(body.method==='tools/call'){
  if(!mediaTools.some(t=>t.name===body.params?.name))return Response.json({jsonrpc:'2.0',id:body.id,error:{code:-32602,message:'Unknown tool'}});
  try{const result=await callMediaTool(body.params.name,body.params.arguments||{},identity.email);return reply({content:[{type:'text',text:JSON.stringify(result)}]});}
  catch(error){return reply({isError:true,content:[{type:'text',text:error instanceof Error?error.message:'Không lưu được ảnh.'}]});}
 }
 return Response.json({jsonrpc:'2.0',id:body.id,error:{code:-32601,message:'Method not found'}});
}
export async function GET(req:Request){if(!originAllowed(req))return new Response(null,{status:403});if(!await mcpIdentity(req))return authChallenge(req);return new Response(null,{status:405,headers:{Allow:'POST'}});}
