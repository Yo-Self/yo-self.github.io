"use client";

import { motion } from "framer-motion";
import { GESTOR_URL } from "./data";

export default function LandingCTA() {
  return (
    <section className="py-24 px-6 mb-12 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-[2.5rem] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20" />

        <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Plataforma completa para vender mais
            </h2>
            <p className="text-cyan-100 text-lg max-w-xl">
              Cardápio digital e gestor integrados — configure em minutos e comece a receber pedidos hoje.
            </p>
          </div>
          <div className="flex-shrink-0">
            <a
              href={GESTOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-white text-blue-700 font-bold rounded-full shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Começar agora
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
