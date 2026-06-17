"use client";

import { motion } from "framer-motion";

export default function MockPOS() {
  return (
    <div className="p-4 space-y-2 text-xs">
      <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
        <span className="font-semibold text-gray-900 dark:text-white">Turno aberto</span>
        <span className="text-green-500 text-[10px]">● Online</span>
      </div>
      <div className="flex justify-between text-gray-600 dark:text-gray-400">
        <span>2× Hambúrguer</span>
        <span>R$ 85,80</span>
      </div>
      <div className="flex justify-between text-gray-600 dark:text-gray-400">
        <span>1× Refrigerante</span>
        <span>R$ 8,00</span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="flex justify-between font-bold text-amber-600 dark:text-amber-400 pt-2 border-t border-gray-200 dark:border-gray-700"
      >
        <span>Total</span>
        <span>R$ 93,80</span>
      </motion.div>
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] py-1.5 rounded-lg text-center font-medium">
          Dinheiro
        </div>
        <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] py-1.5 rounded-lg text-center font-medium">
          Cartão
        </div>
      </div>
    </div>
  );
}
