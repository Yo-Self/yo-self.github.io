'use client';

import { useLegacyAppDetection } from '@/hooks/useLegacyAppDetection';
import ServiceWorkerCleanup from '@/components/ServiceWorkerCleanup';

interface LegacyAppWrapperProps {
  children: React.ReactNode;
}

export default function LegacyAppWrapper({ children }: LegacyAppWrapperProps) {
  const { showCleanup } = useLegacyAppDetection();

  // Se detectou versão antiga, mostrar limpeza
  if (showCleanup) {
    return <ServiceWorkerCleanup />;
  }

  // Caso contrário, mostrar conteúdo normal
  return <>{children}</>;
}
