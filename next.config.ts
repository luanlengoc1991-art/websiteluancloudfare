import type {NextConfig} from 'next';
import {initOpenNextCloudflareForDev} from '@opennextjs/cloudflare';
const config:NextConfig={output:'standalone',poweredByHeader:false};
// Gives next dev the same D1 and R2 bindings the Worker uses in production.
initOpenNextCloudflareForDev();
export default config;
