/* Webpack loader (production browser build only, see next.config.ts): replaces the readable lot table of
 * lib/*-lots.ts (unit code → x/y on the master plan) with a gzip + XOR blob in the lib/wire.ts format, decoded
 * when the map loads. The export becomes a Promise; plan-maps.ts reaches it through `.then(m => m.X)`, which waits for it.
 * The mask below must stay identical to mask() in lib/wire.ts. */
const {gzipSync} = require('node:zlib');
const {randomBytes} = require('node:crypto');
const SEED = 0x4c75616e;

function mask(bytes, nonce) {
  let s = SEED;
  for (const b of nonce) s = Math.imul(s ^ b, 0x9e3779b1) >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    bytes[i] ^= s & 255;
  }
  return bytes;
}

module.exports = function lotsLoader(source) {
  const m = /export const (\w+)\s*:[^=]+=\s*(\{[\s\S]*\})\s*;?\s*$/.exec(source);
  if (!m) throw new Error('lots-loader: unexpected format in ' + this.resourcePath);
  const json = JSON.stringify(JSON.parse(m[2]));
  const nonce = randomBytes(8);
  const blob = Buffer.concat([nonce, mask(gzipSync(json, {level: 9}), nonce)]).toString('base64');
  return `import {unpack} from '@/lib/wire';\nexport const ${m[1]} = unpack(${JSON.stringify(blob)});\n`;
};
