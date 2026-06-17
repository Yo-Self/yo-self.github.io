"use client";

import { motion } from "framer-motion";

export default function MockQRTable() {
  return (
    <div className="p-4 flex items-center gap-4">
      <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-lg grid grid-cols-3 gap-0.5 p-2 flex-shrink-0">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-sm ${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-700 dark:bg-gray-300"}`}
          />
        ))}
      </div>
      <div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-mono text-cyan-600 dark:text-cyan-400"
        >
          ?table=12
        </motion.p>
        <p className="text-[10px] text-gray-500 mt-1">Escaneie e peça direto da mesa</p>
      </div>
    </div>
  );
}
