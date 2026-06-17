"use client";

import { motion } from "framer-motion";
import AnimatedStaticDishCard from "@/components/AnimatedStaticDishCard";
import ImageWithLoading from "@/components/ImageWithLoading";
import { LANDING_SAMPLE_DISHES, MOENDO_DISHES } from "./data";

const showcaseItems = [
  { title: "Cards Detalhados", view: "Exibição padrão focada nos ingredientes", dishes: LANDING_SAMPLE_DISHES.slice(0, 2), layout: "list" as const },
  { title: "Grid Rápido", view: "Para escaneabilidade e escolha rápida", dishes: LANDING_SAMPLE_DISHES, layout: "grid" as const },
  { title: "Modo Jornal", view: "Navegação por gestos imersiva", layout: "journal" as const },
  { title: "Modo Delivery", view: "Formulário de entrega e cálculo de frete", layout: "delivery" as const },
];

export default function LandingUIShowcase() {
  return (
    <section className="py-24 px-6 relative max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Construído para qualquer formato</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
          Visualizações ricas para diferentes momentos da experiência de consumo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {showcaseItems.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.15 }}
            className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden group"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.view}</p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-black/20">
              {item.layout === "journal" ? (
                <div className="grid grid-cols-2 gap-3">
                  {MOENDO_DISHES.slice(0, 4).map((dish, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                      <ImageWithLoading
                        src={dish.image}
                        alt={dish.name}
                        clickable={false}
                        className="w-full h-24 object-cover"
                        fallbackSrc="/window.svg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                        <span className="text-white text-[10px] font-medium leading-tight">{dish.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : item.layout === "delivery" ? (
                <div className="space-y-3">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500">Frete estimado</span>
                    <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">R$ 8,50</span>
                  </div>
                </div>
              ) : (
                <div className={item.layout === "grid" ? "grid grid-cols-2 gap-3" : "space-y-4"}>
                  {item.dishes?.map((dish, i) => (
                    <div key={i} className="group-hover:scale-[1.02] transition-transform duration-300">
                      <AnimatedStaticDishCard dish={dish} size="small" index={i} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
