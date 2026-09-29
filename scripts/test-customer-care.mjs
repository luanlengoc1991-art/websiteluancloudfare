import assert from 'node:assert/strict';
import {classifyCustomerMessage} from '../lib/customer-care.ts';
import {publicContact} from '../lib/public-contact.ts';

const cases=[
 ['Tôi muốn hoàn tiền','sensitive'],
 ['Có giảm giá thêm không?','sensitive'],
 ['Tôi muốn gặp nhân viên tư vấn','contact'],
 ['Căn SX2-10 giá bao nhiêu?','general'],
];

for(const [message,expected] of cases){
 assert.equal(classifyCustomerMessage(message),expected,`Sai phân loại: ${message}`);
}

assert.deepEqual(publicContact,{
 phone:'0343977651',
 email:'luanlengoc1991@gmail.com',
 zaloHref:'https://zalo.me/0343977651',
 facebookHref:'https://www.facebook.com/luan.lengoc.5/',
});

console.log(JSON.stringify({ok:true,cases:cases.length,publicContact:true}));
