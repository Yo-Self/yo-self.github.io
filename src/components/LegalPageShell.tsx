import Link from "next/link";

interface LegalPageShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function LegalPageShell({
  title,
  description,
  children,
}: LegalPageShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans selection:bg-cyan-500/30">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-20">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {title}
          </h1>
          {description ? (
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              {description}
            </p>
          ) : null}
        </header>

        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:dark:text-white [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:dark:text-white [&_h3]:mt-6 [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-cyan-600 [&_a]:dark:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-10 px-6 text-center text-gray-500 text-sm">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4">
          <Link href="/suporte" className="hover:text-cyan-600 dark:hover:text-cyan-400">
            Suporte
          </Link>
          <Link href="/privacidade" className="hover:text-cyan-600 dark:hover:text-cyan-400">
            Privacidade
          </Link>
          <a
            href="https://gestor.yo-self.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-600 dark:hover:text-cyan-400"
          >
            Área do restaurante
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} Yoself. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
