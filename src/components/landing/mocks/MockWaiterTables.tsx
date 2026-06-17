"use client";

import { motion } from "framer-motion";

const tables = [
  { num: 1, status: "free" },
  { num: 2, status: "occupied" },
  { num: 3, status: "occupied" },
  { num: 4, status: "free" },
  { num: 5, status: "calling" },
  { num: 6, status: "free" },
];

const statusColors: Record<string, string> = {
  free: "bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-400",
  occupied: "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-400",
  calling: "bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-400 animate-pulse",
};

export default function MockWaiterTables() {
  return (
    <div className="p-4 grid grid-cols-3 gap-2">
      {tables.map((table, i) => (
        <motion.div
          key={table.num}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className={`aspect-square rounded-xl border flex flex-col items-center justify-center ${statusColors[table.status]}`}
        >
          <span className="text-[10px] font-medium">Mesa</span>
          <span className="text-sm font-bold">{table.num}</span>
        </motion.div>
      ))}
    </div>
  );
}
