"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  // Não mostrar navegação em páginas específicas de restaurante
  if (pathname.startsWith('/restaurant/')) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/favicon.svg" alt="Yoself" className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Yoself
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400'
              }`}
            >
              Início
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
}
