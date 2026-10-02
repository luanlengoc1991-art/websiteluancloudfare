import type {Metadata} from 'next';
import Hub from '@/components/hub';

export const metadata: Metadata = {
  title: 'AlphaHub | Không gian kết nối bất động sản',
  description: 'Khám phá AlphaHub: kết nối trải nghiệm dự án 360°, quỹ căn, thông tin sản phẩm và công cụ tư vấn bất động sản trên một nền tảng.',
};

export default function AlphaHubPage() {return <Hub route={['alphahub']}/>;}
