import type {Metadata} from 'next';
import Hub from '@/components/hub';
import {alphaHubContent} from '@/lib/alphahub-content';

export const metadata: Metadata = {
  title: 'AlphaHub | Nền tảng công nghệ bất động sản',
  description: alphaHubContent.introduction,
};

export default function AlphaHubPage() {return <Hub route={['alphahub']}/>;}
