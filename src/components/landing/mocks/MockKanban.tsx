"use client";

import { motion } from "framer-motion";

const columns = [
  { title: "Novos", count: 2, color: "border-blue-400" },
  { title: "Preparo", count: 1, color: "border-amber-400" },
  { title: "Prontos", count: 1, color: "border-green-400" },
];

export default function MockKanban() {
  return (
    <div className="p-3 flex gap-2 min-h-[120px]">
      {columns.map((col, i) => (
        <motion.div
          key={col.title}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          className="flex-1 min-w-0"
        >
          <p className="text-[9px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{col.title}</p>
          <div className={`space-y-1.5 border-t-2 ${col.color} pt-1.5`}>
            {Array.from({ length: col.count }).map((_, j) => (
              <div
                key={j}
                className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <p className="text-[9px] font-medium text-gray-800 dark:text-gray-200">#{1024 + i * 3 + j}</p>
                <p className="text-[8px] text-gray-400">R$ {(35 + j * 12).toFixed(2).replace(".", ",")}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
