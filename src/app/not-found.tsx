"use client";

import { useEffect, useState } from "react";

export default function NotFound() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    try {
      const path = window.location.pathname || "";
      // Se estiver acessando /restaurant/<id> sem barra final, redireciona para a versão com barra
      const m = path.match(/^\/restaurant\/([^\/]+)$/);
      if (m && !isRedirecting) {
        setIsRedirecting(true);
        const target = path + "/" + (window.location.search || "") + (window.location.hash || "");
        window.location.replace(target);
      }
    } catch (error) {
      console.error('Erro no redirecionamento:', error);
    }
  }, [isRedirecting]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="text-center p-6">
        <h1 className="text-3xl font-bold mb-2">404</h1>
        <p className="text-gray-600 dark:text-gray-300">
          {isRedirecting ? 'Redirecionando...' : 'Esta página não foi encontrada.'}
        </p>
      </div>
    </div>
  );
}


