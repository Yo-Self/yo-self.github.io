import Link from "next/link";
import { GESTOR_URL } from "./data";

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-12 px-6 text-center text-gray-500 text-sm">
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4">
        <Link href="/suporte" className="hover:text-cyan-600 dark:hover:text-cyan-400">
          Suporte
        </Link>
        <Link href="/privacidade" className="hover:text-cyan-600 dark:hover:text-cyan-400">
          Privacidade
        </Link>
        <a
          href={GESTOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-cyan-600 dark:hover:text-cyan-400"
        >
          Área do restaurante
        </a>
      </div>
      <p>&copy; {new Date().getFullYear()} Yoself. Todos os direitos reservados.</p>
    </footer>
  );
}
