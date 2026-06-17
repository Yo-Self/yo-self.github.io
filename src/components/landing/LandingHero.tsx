"use client";

import { motion } from "framer-motion";
import AnimatedStaticDishCard from "@/components/AnimatedStaticDishCard";
import { LANDING_SAMPLE_DISHES, GESTOR_URL } from "./data";

export default function LandingHero() {
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-32 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[90vh]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] max-w-4xl opacity-30 dark:opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-[128px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full flex flex-col lg:flex-row items-center gap-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-sm font-medium mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            Cardápio digital + gestor integrados
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Cardápio digital + gestor completo para o seu{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
              restaurante.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            IA, pedidos online, delivery, PDV e cozinha — tudo integrado em uma plataforma que encanta clientes e simplifica a operação.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <a
              href="#cardapio"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gray-900 dark:!bg-white text-white dark:!text-gray-900 font-semibold hover:scale-105 transition-transform duration-300 shadow-xl shadow-gray-900/20 dark:shadow-white/20 text-center"
            >
              Ver funcionalidades
            </a>
            <a
              href={GESTOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:!bg-gray-900 text-gray-900 dark:!text-white border border-gray-200 dark:border-gray-800 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-300 text-center"
            >
              Acessar gestor
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.2, type: "spring" }}
          className="flex-1 w-full max-w-lg relative perspective-[1000px]"
        >
          <div className="relative rounded-[2.5rem] bg-gray-100 dark:bg-gray-900/50 p-4 border-[8px] border-white dark:border-gray-800 shadow-2xl backdrop-blur-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-white dark:bg-gray-800 rounded-b-xl z-20" />
            <div className="rounded-2xl overflow-hidden bg-white dark:bg-black shadow-inner relative">
              <AnimatedStaticDishCard dish={LANDING_SAMPLE_DISHES[0]} size="large" index={0} />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="absolute -top-2 -right-2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500 text-white text-xs font-medium shadow-lg"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              IA ativa
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute -bottom-10 -left-10 md:-left-16 w-56 p-2 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-2xl z-30"
          >
            <AnimatedStaticDishCard dish={LANDING_SAMPLE_DISHES[1]} size="small" index={1} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
