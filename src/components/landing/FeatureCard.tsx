"use client";

import { motion } from "framer-motion";
import type { LandingAccent } from "./types";

interface FeatureCardProps {
  title: string;
  description: string;
  delay?: number;
  accent?: LandingAccent;
  colSpan?: 1 | 2 | 4;
  mock?: React.ReactNode;
  dark?: boolean;
}

const accentStyles: Record<LandingAccent, { border: string; glow: string; gradient: string }> = {
  cyan: {
    border: "hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/20",
    glow: "from-cyan-500/5 to-fuchsia-500/5",
    gradient: "from-cyan-500 to-blue-600",
  },
  amber: {
    border: "hover:shadow-amber-500/10 dark:hover:shadow-amber-500/20",
    glow: "from-amber-500/5 to-orange-500/5",
    gradient: "from-amber-500 to-orange-600",
  },
};

export default function FeatureCard({
  title,
  description,
  delay = 0,
  accent = "cyan",
  colSpan = 1,
  mock,
  dark = false,
}: FeatureCardProps) {
  const styles = accentStyles[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className={`group relative p-6 md:p-8 rounded-3xl backdrop-blur-xl border shadow-xl transition-all duration-300 overflow-hidden ${
        colSpan === 4 ? "lg:col-span-4" : colSpan === 2 ? "lg:col-span-2" : ""
      } ${
        dark
          ? "bg-gray-800/60 border-gray-700/50 shadow-black/20"
          : "bg-white/60 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-800/50 shadow-gray-200/20 dark:shadow-black/20"
      } hover:shadow-2xl ${styles.border}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative z-10 flex flex-col h-full">
        <h3 className={`text-lg md:text-xl font-bold mb-2 ${dark ? "text-white" : "text-gray-900 dark:text-white"}`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed mb-4 ${dark ? "text-gray-400" : "text-gray-600 dark:text-gray-400"}`}>
          {description}
        </p>
        {mock && (
          <div className="mt-auto rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/80 dark:bg-black/30">
            {mock}
          </div>
        )}
      </div>
    </motion.div>
  );
}
