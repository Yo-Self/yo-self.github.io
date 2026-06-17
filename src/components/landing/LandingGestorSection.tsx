"use client";

import FeatureCard from "./FeatureCard";
import { GESTOR_FEATURES, GESTOR_URL } from "./data";
import { GESTOR_MOCKS } from "./mocks";

export default function LandingGestorSection() {
  return (
    <section id="gestor" className="py-24 px-6 bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-[128px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-sm font-semibold tracking-wider text-amber-400 uppercase mb-3">
            Para o restaurante
          </h2>
          <h3 className="text-3xl md:text-5xl font-bold mb-6">Gestor completo</h3>
          <p className="text-gray-400 text-lg">
            PDV, cozinha, delivery, relatórios e financeiro — gerencie tudo em tempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {GESTOR_FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              title={feature.title}
              description={feature.description}
              delay={index * 0.08}
              accent="amber"
              colSpan={feature.colSpan}
              mock={GESTOR_MOCKS[feature.id]}
              dark
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href={GESTOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-full shadow-xl hover:scale-105 transition-all duration-300"
          >
            Começar no gestor
          </a>
        </div>
      </div>
    </section>
  );
}
