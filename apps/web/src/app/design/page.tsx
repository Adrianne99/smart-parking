import type { Metadata } from 'next';
import { DesignShowcase } from './design-showcase';

export const metadata: Metadata = { title: 'Design system · Smart Parking' };

export default function DesignPage() {
  return <DesignShowcase />;
}
