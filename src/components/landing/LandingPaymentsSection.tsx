"use client";

import { motion } from "framer-motion";

const methods = [
  {
    name: "WhatsApp",
    description: "Pedido formatado com itens e endereço",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
    icon: "💬",
  },
  {
    name: "Stripe",
    description: "Cartão, Apple Pay e Google Pay",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    icon: "💳",
  },
  {
    name: "PIX",
    description: "Pagamento instantâneo via InfinitePay",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
    icon: "⚡",
  },
  {
    name: "Mesa",
    description: "Envio direto para a cozinha",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    icon: "🍽️",
  },
];

export default function LandingPaymentsSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-sm font-semibold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase mb-3">
            Pagamentos
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold">O cliente escolhe como pagar</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {methods.map((method, index) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-5 rounded-2xl ${method.bg} border border-gray-100 dark:border-gray-800 text-center`}
            >
              <span className="text-2xl mb-2 block">{method.icon}</span>
              <h4 className={`font-bold text-sm ${method.color}`}>{method.name}</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">{method.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
