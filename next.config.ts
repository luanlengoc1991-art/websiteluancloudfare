import type {NextConfig} from 'next';
import {initOpenNextCloudflareForDev} from '@opennextjs/cloudflare';
import path from 'node:path';
// Production browser bundles of the Quỹ căn 360° page (map, tags, callouts, data decoder) are obfuscated so the code
// cannot be read or copied into an AI. Source in GitHub stays readable; dev builds and server code are untouched.
const PROTECTED=/[\\/](components[\\/]plan-map-360\.tsx|lib[\\/](plan-callouts|plan-maps|plan-funds|wire)\.ts)$/;
const config:NextConfig={output:'standalone',poweredByHeader:false,productionBrowserSourceMaps:false,
 webpack(cfg,{dev,isServer}){
  // Lot tables (unit code → position on the plan) ship as an encoded blob instead of a readable object.
  if(!dev&&!isServer)cfg.module.rules.push({test:/[\\/]lib[\\/](green-paradise|saigon-park)-lots\.ts$/,enforce:'pre',use:{loader:path.resolve('scripts/lots-loader.cjs')}});
  if(!dev&&!isServer)cfg.module.rules.push({test:PROTECTED,enforce:'post',use:{loader:'webpack-obfuscator/dist/loader',options:{
   compact:true,ignoreImports:true,identifierNamesGenerator:'hexadecimal',renameGlobals:false,
   stringArray:true,stringArrayEncoding:['base64'],stringArrayThreshold:1,stringArrayRotate:true,stringArrayShuffle:true,
   stringArrayWrappersCount:1,splitStrings:true,splitStringsChunkLength:8,
   // Kept off: they slow the map's drag/zoom loop or can break the minified bundle.
   controlFlowFlattening:false,deadCodeInjection:false,selfDefending:false,debugProtection:false,transformObjectKeys:false,
   numbersToExpressions:false,unicodeEscapeSequence:false,sourceMap:false}}});
  return cfg;
 }};
// Gives next dev the same D1 and R2 bindings the Worker uses in production.
initOpenNextCloudflareForDev();
export default config;
