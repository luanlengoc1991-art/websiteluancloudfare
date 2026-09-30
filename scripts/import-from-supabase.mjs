import {spawn} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

/**
 * One-off move of the Supabase data into Cloudflare D1 and R2.
 * Reads the Supabase credentials from .env.local so no secret is ever committed,
 * and writes the generated SQL into data/, which git ignores.
 *
 *   npm run db:import            apply to the production D1 and R2
 *   npm run db:import -- --local apply to the local runtime used by npm test
 */
const local = process.argv.includes('--local');
const target = local ? '--local' : '--remote';
const wrangler = join(process.cwd(), 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const outputDir = 'data';
const sqlPath = join(outputDir, 'supabase-export.sql');

function credentials() {
  const env = {...process.env};
  if (existsSync('.env.local')) {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (match && !env[match[1]]) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  const url = env.SUPABASE_URL, key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu SUPABASE_URL và SUPABASE_SECRET_KEY. Thêm vào .env.local rồi chạy lại.');
  return {url: url.replace(/\/$/, ''), key};
}
const {url, key} = credentials();
const headers = {apikey: key, ...(key.startsWith('sb_secret_') ? {} : {Authorization: `Bearer ${key}`})};

async function readTable(table, columns) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const response = await fetch(`${url}/rest/v1/${table}?select=${columns}&order=id.asc&limit=500&offset=${offset}`, {headers, cache: 'no-store'});
    if (!response.ok) throw new Error(`Không đọc được ${table}: ${response.status}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}
const quote = (value) => (value === null || value === undefined ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`);
const number = (value) => String(Number(value) || 0);
const runWrangler = (args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [wrangler, ...args], {stdio: ['ignore', 'pipe', 'pipe']});
  let output = '';
  child.stdout.on('data', (b) => (output += b));
  child.stderr.on('data', (b) => (output += b));
  child.on('exit', (code) => (code === 0 ? resolve(output) : reject(new Error(output))));
});

const [records, reservations, files] = await Promise.all([
  readTable('alpha_records', 'owner,kind,id,payload,updated'),
  readTable('alpha_reservations', 'id,owner,unit_id,customer_id,note,status,expires_at,created_at'),
  readTable('alpha_files', 'id,owner,project_id,kind,name,mime,object_key')
]);

mkdirSync(outputDir, {recursive: true});
const statements = [
  ...records.map((r) => `INSERT OR REPLACE INTO records(owner,kind,id,payload,updated) VALUES(${quote(r.owner)},${quote(r.kind)},${quote(r.id)},${quote(r.payload)},${number(r.updated)});`),
  ...reservations.map((r) => `INSERT OR REPLACE INTO reservations(id,owner,unit_id,customer_id,note,status,expires_at,created_at) VALUES(${quote(r.id)},${quote(r.owner)},${quote(r.unit_id)},${quote(r.customer_id)},${quote(r.note)},${quote(r.status)},${number(r.expires_at)},${number(r.created_at)});`),
  ...files.map((f) => `INSERT OR REPLACE INTO files(id,owner,project_id,kind,name,mime,object_key) VALUES(${quote(f.id)},${quote(f.owner)},${quote(f.project_id)},${quote(f.kind)},${quote(f.name)},${quote(f.mime)},${quote(f.object_key)});`)
];
writeFileSync(sqlPath, statements.join('\n') + '\n');
console.log(`Đã xuất ${records.length} bản ghi, ${reservations.length} giao dịch, ${files.length} file vào ${sqlPath}`);

if (statements.length) {
  await runWrangler(['d1', 'execute', 'alpha-hub', target, '--yes', '--file', sqlPath]);
  console.log('Đã nạp dữ liệu vào D1.');
}

// Copy each stored object from Supabase Storage into R2 under the same key.
let copied = 0, missing = [];
for (const file of files) {
  const objectUrl = `${url}/storage/v1/object/alpha-assets/${file.object_key.split('/').map(encodeURIComponent).join('/')}`;
  const response = await fetch(objectUrl, {headers, cache: 'no-store'});
  if (!response.ok) { missing.push(`${file.name} (${response.status})`); continue; }
  const temporary = join(outputDir, 'object.tmp');
  writeFileSync(temporary, Buffer.from(await response.arrayBuffer()));
  await runWrangler(['r2', 'object', 'put', `alpha-assets/${file.object_key}`, '--file', temporary, '--content-type', file.mime, target]);
  rmSync(temporary, {force: true});
  copied++;
}
console.log(`Đã chuyển ${copied}/${files.length} file sang R2.`);
if (missing.length) console.warn('Không tải được: ' + missing.join(', '));
