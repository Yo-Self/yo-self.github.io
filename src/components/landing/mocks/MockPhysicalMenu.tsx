"use client";

import { motion } from "framer-motion";

export default function MockPhysicalMenu() {
  return (
    <div className="p-4 flex justify-center">
      <motion.div
        initial={{ opacity: 0, rotateY: -10 }}
        whileInView={{ opacity: 1, rotateY: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-24 h-32 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex flex-col"
      >
        <div className="h-3 bg-amber-500/30 rounded mb-2" />
        <div className="space-y-1 flex-1">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded w-full" />
          <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded w-4/5" />
          <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded w-full" />
          <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded w-3/5" />
        </div>
        <p className="text-[7px] text-center text-gray-400 mt-1">A4 · Minimalista</p>
      </motion.div>
    </div>
  );
}
