"use client";

import { motion } from "framer-motion";
import DynamicCarousel from "@/components/DynamicCarousel";
import { Restaurant } from "@/components/data";
import { MOENDO_DISHES } from "./data";

const moendoRestaurant: Restaurant = {
  id: "fallback",
  slug: "cafe-moendo",
  name: "Café Moendo",
  welcome_message: "Bem-vindo ao Café Moendo!",
  image: MOENDO_DISHES[0].image,
  menu_categories: ["Cafés", "Lanches"],
  featured_dishes: MOENDO_DISHES.slice(0, 3).map((dish) => ({
    ...dish,
    id: `fallback-${dish.name.toLowerCase().replace(/\s+/g, "-")}`,
    restaurant_id: "fallback",
    categories: dish.tags ?? [],
    category: dish.tags?.[0] || "Geral",
    ingredients: "Ingredientes frescos selecionados",
    allergens: "Consulte o atendente sobre alérgenos",
    portion: "1 porção",
  })),
  menu_items: MOENDO_DISHES.map((dish) => ({
    ...dish,
    id: `fallback-${dish.name.toLowerCase().replace(/\s+/g, "-")}`,
    restaurant_id: "fallback",
    categories: dish.tags ?? [],
    category: dish.tags?.[0] || "Geral",
    ingredients: "Ingredientes frescos selecionados",
    allergens: "Consulte o atendente sobre alérgenos",
    portion: "1 porção",
  })),
} as Restaurant;

export default function LandingCarouselDemo() {
  return (
    <section id="demo" className="py-24 px-6 bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Destaques que dão água na boca</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Um carousel interativo que apresenta seus pratos principais de forma orgânica e sedutora.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="rounded-3xl overflow-hidden bg-black/40 backdrop-blur-2xl border border-gray-700/50 p-4 md:p-8 shadow-2xl carousel-section"
        >
          <DynamicCarousel restaurant={moendoRestaurant} showMostOrderedTitle={true} />
        </motion.div>
      </div>
    </section>
  );
}
