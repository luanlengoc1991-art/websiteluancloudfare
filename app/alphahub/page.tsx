import type {Metadata} from 'next';
import Hub from '@/components/hub';

export const metadata: Metadata = {
  title: 'AlphaHub | Tư vấn và hỗ trợ bất động sản',
  description: 'Kết nối tư vấn cùng AlphaHub, gửi yêu cầu tham quan dự án, tra cứu mã căn và tìm câu trả lời cho hành trình lựa chọn bất động sản.',
};

export default function AlphaHubPage() {return <Hub route={['alphahub']}/>;}
