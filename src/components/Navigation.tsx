"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GESTOR_URL } from '@/components/landing/data';

export default function Navigation() {
  const pathname = usePathname();
  
  if (pathname.startsWith('/restaurant/') || pathname.startsWith('/delivery/')) {
    return null;
  }

  const isHome = pathname === '/';

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
          
          <div className="hidden md:flex items-center space-x-6">
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
            {isHome && (
              <>
                <a
                  href="#cardapio"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Cardápio
                </a>
                <a
                  href="#gestor"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                >
                  Gestor
                </a>
              </>
            )}
            <Link
              href="/suporte"
              className={`text-sm font-medium transition-colors ${
                pathname === '/suporte'
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400'
              }`}
            >
              Suporte
            </Link>
            <Link
              href="/privacidade"
              className={`text-sm font-medium transition-colors ${
                pathname === '/privacidade'
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400'
              }`}
            >
              Privacidade
            </Link>
            <a
              href={GESTOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white transition-colors"
            >
              Área do restaurante
            </a>
          </div>

          {/* Mobile: gestor link */}
          <a
            href={GESTOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden text-sm font-semibold px-3 py-1.5 rounded-full bg-cyan-500 text-white"
          >
            Gestor
          </a>
        </div>
      </div>
    </nav>
  );
}
