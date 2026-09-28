import {randomBytes,scryptSync} from 'node:crypto';
import {existsSync,writeFileSync,mkdirSync} from 'node:fs';
import {createInterface} from 'node:readline/promises';
if(Number(process.versions.node.split('.')[0])!==24)throw Error('Hãy cài Node.js 24 LTS.');
if(existsSync('.env.local')){console.error('Đã có .env.local. Giữ lại file này để sử dụng tài khoản hiện tại. Nếu cần tạo lại, sao lưu và đổi tên file trước.');process.exit(1);}
const rl=createInterface({input:process.stdin,output:process.stdout});
let email;try{email=(await rl.question('Email quản trị của bạn: ')).trim().toLowerCase();}finally{rl.close();}
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Email không hợp lệ.');
mkdirSync('data',{recursive:true});
const password=randomBytes(18).toString('base64url'),salt=randomBytes(16).toString('hex');
const hash=scryptSync(password,salt,64).toString('hex');
writeFileSync('.env.local',`ALPHA_ADMIN_EMAIL=${JSON.stringify(email)}\nALPHA_ADMIN_PASSWORD_HASH="scrypt:${salt}:${hash}"\nALPHA_DATA_DIR=./data\nALPHA_SECURE_COOKIE=false\n`,{mode:0o600,flag:'wx'});
console.log('\nĐã tạo tài khoản quản trị: '+email+'\nMật khẩu: '+password+'\nHãy lưu mật khẩu này. File .env.local chỉ lưu mã băm.\nChạy npm run dev và mở http://localhost:3000/dang-nhap.');
