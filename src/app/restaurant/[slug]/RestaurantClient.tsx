"use client";

import React, { Suspense, useState, useEffect } from "react";
import RestaurantClientPage from "./RestaurantClientPage";
import { useRestaurantBySlug, useRestaurantList } from "@/hooks/useRestaurantBySlug";
import SetCurrentRestaurant from "@/components/SetCurrentRestaurant";

// Loading component for better UX
function RestaurantLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando restaurante...</p>
      </div>
    </div>
  );
}

// Novo componente premium de Splash Screen que espelha o iOS
function PremiumSplash({ phase }: { phase: 'entering' | 'waiting' | 'exiting' }) {
  return (
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-[#53859b] to-[#e59b6e] splash-overlay ${
        phase === 'exiting' ? 'splash-exiting' : ''
      }`}
    >
      <img
        src="/yoself.png"
        alt="YoSelf Logo"
        className={`w-36 h-36 rounded-[28px] shadow-2xl border border-white/10 splash-logo ${
          phase === 'entering' ? 'animate-splash-logo-enter' : ''
        } ${
          phase === 'exiting' ? 'splash-logo-exiting' : ''
        }`}
        style={{
          transform: phase === 'waiting' ? 'scale(1)' : undefined
        }}
      />
    </div>
  );
}

// Error component
function RestaurantError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao carregar restaurante</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

// Restaurant not found component
function RestaurantNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-gray-400 text-6xl mb-4">🍽️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Restaurante não encontrado</h2>
        <p className="text-gray-600">O restaurante que você está procurando não existe ou foi removido.</p>
      </div>
    </div>
  );
}

// Main restaurant client component
export default function RestaurantClient({ slug }: { slug: string }) {
  const { restaurant, isLoading, error, refetch } = useRestaurantBySlug(slug);
  const { restaurants } = useRestaurantList();

  const [showSplash, setShowSplash] = useState(true);
  const [splashPhase, setSplashPhase] = useState<'entering' | 'waiting' | 'exiting'>('entering');
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // 1. Iniciar animação de mola do logo
    const enterTimer = setTimeout(() => {
      setSplashPhase('waiting');
    }, 650);

    // 2. Garantir tempo mínimo de 1.5s
    const minTimeTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(minTimeTimer);
    };
  }, []);

  useEffect(() => {
    // 3. Quando o carregamento terminar e o tempo mínimo passar, inicia saída
    if (!isLoading && minTimeElapsed && restaurant) {
      setSplashPhase('exiting');
      
      // 4. Remover completamente do DOM após a animação de saída de 0.8s
      const exitTimer = setTimeout(() => {
        setShowSplash(false);
      }, 800);

      return () => clearTimeout(exitTimer);
    }
  }, [isLoading, minTimeElapsed, restaurant]);

  // Se houver erro ANTES do carregamento inicial, exibe a tela de erro
  if (error && !restaurant) {
    return <RestaurantError error={error} onRetry={refetch} />;
  }

  // Se o carregamento terminou e o restaurante não existe, exibe 404
  if (!isLoading && !restaurant && minTimeElapsed) {
    return <RestaurantNotFound />;
  }

  return (
    <>
      <SetCurrentRestaurant />
      
      {/* Renderiza a página em background se os dados já estiverem disponíveis */}
      {restaurant && (
        <Suspense fallback={<RestaurantLoading />}>
          <RestaurantClientPage
            initialRestaurant={restaurant}
            restaurants={restaurants}
          />
        </Suspense>
      )}

      {/* Splash Screen Premium por cima com z-index elevadíssimo */}
      {showSplash && (
        <PremiumSplash phase={splashPhase} />
      )}
    </>
  );
}