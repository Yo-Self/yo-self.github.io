"use client";

import { motion } from "framer-motion";

const steps = [
  { label: "Recebido", done: true },
  { label: "Preparo", done: true, active: true },
  { label: "Pronto", done: false },
];

export default function MockOrderTracking() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex flex-col items-center flex-1">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                step.active
                  ? "bg-cyan-500 text-white ring-4 ring-cyan-500/30"
                  : step.done
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400"
              }`}
            >
              {step.done ? "✓" : i + 1}
            </motion.div>
            <span className="text-[9px] text-gray-500 mt-1">{step.label}</span>
          </div>
        ))}
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "66%" }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
        />
      </div>
    </div>
  );
}
