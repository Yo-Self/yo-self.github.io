"use client";

import dynamic from 'next/dynamic';

// Dynamically import WaiterCallAnimationDemo to avoid SSR issues
const WaiterCallAnimationDemo = dynamic(() => import('@/components/WaiterCallAnimationDemo'), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>
});

export default function WaiterCallAnimationPage() {
  return <WaiterCallAnimationDemo />;
}
