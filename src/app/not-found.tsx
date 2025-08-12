"use client";

import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    try {
      const path = window.location.pathname || "";
      // Se estiver acessando /restaurant/<id> sem barra final, redireciona para a versão com barra
      const m = path.match(/^\/restaurant\/([^\/]+)$/);
      if (m) {
        const target = path + "/" + (window.location.search || "") + (window.location.hash || "");
        window.location.replace(target);
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="text-center p-6">
        <h1 className="text-3xl font-bold mb-2">404</h1>
        <p className="text-gray-600 dark:text-gray-300">Esta página não foi encontrada.</p>
      </div>
    </div>
  );
}


