import assert from 'node:assert/strict';
import {build} from 'esbuild';
// Exercise the real resolver code without paid API calls or production secrets.
const bundled=await build({entryPoints:['lib/media-ai.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {resolveMediaCommand}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const targets=[{id:'project:test:cover',label:'Ảnh đại diện · Dự án thử',url:'',scope:'test',kind:'gallery'},{id:'article:test:cover',label:'Ảnh bài viết · Bài thử',url:'',scope:'site-library',kind:'image'}];
const originalFetch=globalThis.fetch,oldOpenAI=process.env.OPENAI_API_KEY,oldClaude=process.env.ANTHROPIC_API_KEY;
try{
 delete process.env.OPENAI_API_KEY;await assert.rejects(()=>resolveMediaCommand('openai','Thay ảnh',targets),/OPENAI_API_KEY/);
 process.env.OPENAI_API_KEY='test-placeholder';process.env.ANTHROPIC_API_KEY='test-placeholder';
 let chosen='project:test:cover';
 globalThis.fetch=async(url,options)=>{const request=JSON.parse(options.body);assert.ok(request.messages.some(m=>m.role==='user'));assert.ok(options.signal);const json=JSON.stringify({targetId:chosen,explanation:'Đã xác định vị trí'});
  if(url==='https://api.openai.com/v1/chat/completions'){assert.equal(request.response_format.type,'json_object');assert.ok(request.max_completion_tokens);return Response.json({choices:[{message:{content:json}}]});}
  assert.equal(url,'https://api.anthropic.com/v1/messages');assert.equal(options.headers['anthropic-version'],'2023-06-01');assert.ok(request.system);return Response.json({content:[{type:'text',text:'```json\n'+json+'\n```'}]});
 };
 assert.equal((await resolveMediaCommand('openai','Thay ảnh dự án thử',targets)).targetId,chosen);
 assert.equal((await resolveMediaCommand('claude','Thay ảnh dự án thử',targets)).targetId,chosen);
 chosen=null;assert.equal((await resolveMediaCommand('openai','Tôi chưa muốn đổi ảnh',targets)).targetId,null);
 chosen='made-up';await assert.rejects(()=>resolveMediaCommand('claude','Thay ảnh',targets),/không hợp lệ/);
 chosen='article:test:cover';await assert.rejects(()=>resolveMediaCommand('openai','Thay ảnh',targets,'project:test:cover'),/không hợp lệ/);
 globalThis.fetch=async()=>Response.json({error:{message:'sensitive provider detail'}},{status:401});await assert.rejects(()=>resolveMediaCommand('openai','Thay ảnh',targets),/Dịch vụ AI/);
 globalThis.fetch=async()=>Response.json({choices:[{message:{content:'not-json'}}]});await assert.rejects(()=>resolveMediaCommand('openai','Thay ảnh',targets),/chưa xác định/);
 console.log('PASS: OpenAI/Claude request contracts, JSON parsing, clarification, invalid targets, provider errors; mocked API only.');
}finally{globalThis.fetch=originalFetch;for(const [key,value] of [['OPENAI_API_KEY',oldOpenAI],['ANTHROPIC_API_KEY',oldClaude]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
