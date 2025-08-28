'use client';

import { useDynamicManifest } from '@/hooks/useDynamicManifest';

export default function DynamicManifestProvider() {
  // Este hook atualiza automaticamente o manifest baseado na rota atual
  useDynamicManifest();
  
  // Componente não renderiza nada, só executa o hook
  return null;
}
