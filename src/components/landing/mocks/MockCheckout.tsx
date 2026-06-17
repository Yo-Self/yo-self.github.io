"use client";

import { motion } from "framer-motion";

const buttons = [
  { label: "WhatsApp", color: "bg-green-500", delay: 0.1 },
  { label: "PIX", color: "bg-teal-500", delay: 0.25 },
  { label: "Cartão", color: "bg-blue-500", delay: 0.4 },
  { label: " Apple Pay", color: "bg-gray-900 dark:bg-gray-700", delay: 0.55 },
];

export default function MockCheckout() {
  return (
    <div className="p-4 space-y-2">
      {buttons.map((btn) => (
        <motion.div
          key={btn.label}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: btn.delay }}
          className={`${btn.color} text-white text-xs font-medium py-2.5 px-4 rounded-xl text-center`}
        >
          {btn.label}
        </motion.div>
      ))}
    </div>
  );
}
