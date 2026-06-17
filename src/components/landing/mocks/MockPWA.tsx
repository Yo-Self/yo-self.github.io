"use client";

import { motion } from "framer-motion";

export default function MockPWA() {
  return (
    <div className="p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg">
          Y
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 dark:text-white">Instalar Yoself</p>
          <p className="text-[10px] text-gray-500">Adicionar à tela inicial</p>
        </div>
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium"
      >
        Offline OK
      </motion.span>
    </div>
  );
}
