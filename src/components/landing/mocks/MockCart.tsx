"use client";

import { motion } from "framer-motion";

export default function MockCart() {
  return (
    <div className="p-4 space-y-2 text-xs">
      <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700">
        <span className="text-gray-700 dark:text-gray-300">Hambúrguer Artesanal</span>
        <span className="font-medium">R$ 42,90</span>
      </div>
      <div className="flex justify-between items-center py-1 pl-3 text-gray-500 dark:text-gray-400">
        <span>+ Bacon extra</span>
        <span>R$ 5,00</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700">
        <span className="text-gray-700 dark:text-gray-300">Cappuccino × 2</span>
        <span className="font-medium">R$ 25,00</span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="flex justify-between items-center pt-2 font-bold text-gray-900 dark:text-white"
      >
        <span>Total</span>
        <span className="text-cyan-600 dark:text-cyan-400">R$ 72,90</span>
      </motion.div>
    </div>
  );
}
