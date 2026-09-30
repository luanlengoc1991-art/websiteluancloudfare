import {randomBytes, scryptSync} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';

// Tạo mật khẩu quản trị mới. Mật khẩu ghi ra data/ (git bỏ qua) để không đi qua
// chat hay repo; chỉ mã băm được in ra để dán vào Settings của Worker.
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
mkdirSync('data', {recursive: true});
writeFileSync('data/mat-khau-quan-tri.txt', `Mật khẩu quản trị: ${password}\nLưu vào nơi an toàn rồi xóa file này.\n`, {mode: 0o600});
console.log(`scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`);
