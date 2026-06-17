"use client";

import { motion } from "framer-motion";

const bars = [40, 65, 45, 80, 55, 90, 70];

export default function MockReports() {
  return (
    <div className="p-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-3"
      >
        R$ 12.450
      </motion.div>
      <div className="flex items-end gap-1 h-16">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="flex-1 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-sm min-h-[4px]"
          />
        ))}
      </div>
      <p className="text-[9px] text-gray-500 mt-2 text-center">Receita · últimos 7 dias</p>
    </div>
  );
}
