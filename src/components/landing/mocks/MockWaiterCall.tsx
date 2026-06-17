"use client";

import { motion } from "framer-motion";

export default function MockWaiterCall() {
  return (
    <div className="p-4 flex flex-col items-center gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        className="w-full py-2.5 bg-amber-500 text-white text-xs font-semibold rounded-xl"
      >
        Chamar garçom
      </motion.button>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="w-full p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center"
      >
        <p className="text-[10px] text-gray-500 mb-1">Mesa identificada</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">Mesa 12</p>
        <p className="text-[10px] text-gray-400 mt-1">Aguardando atendimento...</p>
      </motion.div>
    </div>
  );
}
