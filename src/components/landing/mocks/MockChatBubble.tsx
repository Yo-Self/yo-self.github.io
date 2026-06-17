"use client";

import { motion } from "framer-motion";

export default function MockChatBubble() {
  return (
    <div className="p-4 space-y-3 min-h-[140px]">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="flex gap-2"
      >
        <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs">🤖</div>
        <div className="bg-cyan-500/10 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 dark:text-gray-300 max-w-[85%]">
          Recomendo o <span className="font-semibold text-cyan-600 dark:text-cyan-400">*Hambúrguer Artesanal*</span> — é o mais pedido!
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="flex gap-2 justify-end"
      >
        <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
          Tem opção vegana?
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-2 text-[10px] text-cyan-600 dark:text-cyan-400"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
        </span>
        Voz ativada · Luciana pt-BR
      </motion.div>
    </div>
  );
}
