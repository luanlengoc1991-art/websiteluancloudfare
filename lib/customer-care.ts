export type CustomerCareIntent='sensitive'|'contact'|'general';

export function normalizeCustomerMessage(value:string){
 return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
}

export function classifyCustomerMessage(value:string):CustomerCareIntent{
 const message=normalizeCustomerMessage(value);
 if(/khieu nai|hoan tien|giam gia|boi thuong|tranh chap|phap ly|cam ket|dat coc|hop dong|huy giao dich|du lieu ca nhan/.test(message))return 'sensitive';
 if(/lien he|hotline|zalo|tu van|nhan vien|nguoi that/.test(message))return 'contact';
 return 'general';
}
