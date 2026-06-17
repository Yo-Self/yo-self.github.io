"use client";

import FeatureCard from "./FeatureCard";
import { CARDAPIO_FEATURES } from "./data";
import { CARDAPIO_MOCKS } from "./mocks";

export default function LandingCardapioSection() {
  return (
    <section id="cardapio" className="py-24 px-6 relative">
      <div id="features" className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-sm font-semibold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase mb-3">
            Para o cliente
          </h2>
          <h3 className="text-3xl md:text-5xl font-bold mb-6">Cardápio digital completo</h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            IA, pedidos, delivery e pagamentos — tudo que o seu cliente precisa em um só lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CARDAPIO_FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              title={feature.title}
              description={feature.description}
              delay={index * 0.08}
              accent="cyan"
              colSpan={feature.colSpan}
              mock={CARDAPIO_MOCKS[feature.id]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
