'use client';

import { useStartupRedirect } from '@/hooks/useStartupRedirect';

export default function StartupRedirect() {
  useStartupRedirect();
  return null;
}
