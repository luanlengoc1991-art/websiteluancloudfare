import {publicOrigin,mediaResource,mediaScope} from '@/lib/media-oauth';
export function GET(req:Request){return Response.json({resource:mediaResource(req),authorization_servers:[publicOrigin(req)],scopes_supported:[mediaScope],bearer_methods_supported:['header'],resource_name:'Alpha HUB · Thư viện ảnh'});}
