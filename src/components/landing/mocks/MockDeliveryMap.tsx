"use client";

import { motion } from "framer-motion";

export default function MockDeliveryMap() {
  return (
    <div className="p-4 relative min-h-[120px]">
      <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 border border-gray-200 dark:border-gray-700">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-dashed border-cyan-400/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-500" />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="absolute top-1/4 right-1/4 w-2.5 h-2.5 rounded-full bg-green-500"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 rounded-full bg-green-500"
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7 }}
        className="absolute bottom-2 right-2 bg-cyan-500 text-white text-[10px] font-medium px-2 py-1 rounded-lg"
      >
        Frete: R$ 8,50
      </motion.div>
    </div>
  );
}
