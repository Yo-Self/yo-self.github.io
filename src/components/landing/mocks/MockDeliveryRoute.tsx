"use client";

import { motion } from "framer-motion";

const stops = [
  { x: 72, y: 22, n: 1 },
  { x: 82, y: 48, n: 2 },
  { x: 58, y: 62, n: 3 },
];

export default function MockDeliveryRoute() {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-medium text-gray-600 dark:text-gray-300">Entregas ativas</span>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium">
          3 selecionadas
        </span>
      </div>

      <div className="relative h-32 rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-700/80 bg-[#e8eef4] dark:bg-gray-800">
        {/* Ruas */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(#94a3b8 1px, transparent 1px),
              linear-gradient(90deg, #94a3b8 1px, transparent 1px)
            `,
            backgroundSize: "22px 22px",
          }}
        />

        {/* Zona de cobertura */}
        <div className="absolute top-1/2 left-[38%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-dashed border-amber-400/60 bg-amber-400/5" />

        {/* Zona de exclusão */}
        <div className="absolute top-2 right-3 w-14 h-14 rounded-full bg-red-500/20 border border-red-400/40" />

        {/* Zona taxa especial */}
        <div className="absolute bottom-3 left-3 w-12 h-12 rounded-full bg-violet-500/20 border border-violet-400/40" />

        {/* Rota otimizada */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 72" preserveAspectRatio="none">
          <motion.path
            d="M 38 36 L 72 22 L 82 48 L 58 62"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 3"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.25 }}
          />
        </svg>

        {/* Restaurante */}
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="absolute top-1/2 left-[38%] -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white dark:border-gray-900 shadow-md flex items-center justify-center text-white text-[10px]">
            🏪
          </div>
        </motion.div>

        {/* Paradas numeradas */}
        {stops.map((stop, i) => (
          <motion.div
            key={stop.n}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 + i * 0.12 }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
          >
            <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 shadow flex items-center justify-center text-[8px] font-bold text-white">
              {stop.n}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9 }}
          className="text-[9px] text-gray-500 dark:text-gray-400"
        >
          Rota TSP · ~12 km
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="text-[9px] font-medium px-2.5 py-1 rounded-lg bg-amber-500 text-white"
        >
          Abrir no Maps
        </motion.span>
      </div>
    </div>
  );
}
