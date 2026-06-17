"use client";

import { motion } from "framer-motion";

export default function MockIfoodImport() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">iF</div>
        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">ifood.com.br/delivery/...</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "75%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
        />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1 }}
        className="text-[10px] text-gray-500"
      >
        Importando 24 pratos · 18 categorias...
      </motion.p>
    </div>
  );
}
