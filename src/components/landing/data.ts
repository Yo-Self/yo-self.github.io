import type { LandingDish } from "./types";

export const GESTOR_URL = "https://gestor.yo-self.com";

export const LANDING_SAMPLE_DISHES: LandingDish[] = [
  {
    name: "Sushi Salmão Premium",
    description: "Salmão fresco com arroz temperado e nori, acompanhado de wasabi e gengibre",
    price: "R$ 28,90",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
    tags: ["Destaque", "Fresco"],
  },
  {
    name: "Ramen Tradicional",
    description: "Macarrão em caldo rico com carne suína, ovo cozido e vegetais frescos",
    price: "R$ 32,50",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
    tags: ["Mais Pedido"],
  },
  {
    name: "Temaki Atum",
    description: "Cone de nori recheado com atum fresco, arroz e vegetais crocantes",
    price: "R$ 24,90",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=300&fit=crop",
    tags: ["Fresco"],
  },
];

export const MOENDO_DISHES: LandingDish[] = [
  {
    name: "Espresso Especial",
    description: "Café espresso premium",
    price: "8,90",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Destaque", "Cafés"],
  },
  {
    name: "Hambúrguer Artesanal",
    description: "Hambúrguer gourmet com batatas",
    price: "42,90",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Destaque", "Lanches"],
  },
  {
    name: "Cappuccino Cremoso",
    description: "Cappuccino com espuma cremosa e chocolate",
    price: "12,50",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Cafés"],
  },
  {
    name: "Sanduíche Natural",
    description: "Sanduíche com frango e vegetais frescos",
    price: "18,90",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    tags: ["Lanches"],
  },
];

export const CARDAPIO_FEATURES = [
  {
    id: "ai-assistant",
    title: "Assistente IA",
    description: "Chatbot com Gemini que conhece todo o cardápio, sugere pratos e responde por voz em português.",
    colSpan: 2 as const,
  },
  {
    id: "smart-cart",
    title: "Carrinho inteligente",
    description: "Complementos, quantidades e totais calculados automaticamente com persistência entre sessões.",
    colSpan: 1 as const,
  },
  {
    id: "qr-table",
    title: "QR Code por mesa",
    description: "Identificação automática via QR (?table=12) para pedidos no local sem fricção.",
    colSpan: 1 as const,
  },
  {
    id: "multichannel-checkout",
    title: "Checkout multicanal",
    description: "WhatsApp, PIX, cartão e Apple/Google Pay — o cliente escolhe como pagar.",
    colSpan: 2 as const,
  },
  {
    id: "delivery-freight",
    title: "Delivery com frete",
    description: "Cálculo automático de taxa por distância, zonas de exclusão e taxas especiais por área.",
    colSpan: 1 as const,
  },
  {
    id: "waiter-call",
    title: "Chamada de garçom",
    description: "Cliente chama o garçom direto da mesa com número e observações em tempo real.",
    colSpan: 1 as const,
  },
  {
    id: "order-tracking",
    title: "Rastreamento de pedido",
    description: "Cliente acompanha o status em tempo real: recebido, em preparo e pronto.",
    colSpan: 2 as const,
  },
  {
    id: "pwa-offline",
    title: "PWA + Offline",
    description: "Instalável como app, funciona offline e carrega instantaneamente mesmo em 3G.",
    colSpan: 2 as const,
  },
];

export const GESTOR_FEATURES = [
  {
    id: "kanban",
    title: "Kanban de pedidos",
    description: "Colunas arrastáveis com status em tempo real, notificações sonoras e edição de itens.",
    colSpan: 2 as const,
  },
  {
    id: "pos",
    title: "PDV / Caixa",
    description: "Terminal de vendas com turnos, sangria, suprimento e múltiplas formas de pagamento.",
    colSpan: 1 as const,
  },
  {
    id: "waiter-mode",
    title: "Modo garçom",
    description: "Terminal simplificado por mesas para anotar pedidos e enviar à cozinha.",
    colSpan: 1 as const,
  },
  {
    id: "delivery-mgmt",
    title: "Gestão de delivery",
    description: "Mapa com zonas, otimização de rotas TSP e link direto para o Google Maps.",
    colSpan: 2 as const,
  },
  {
    id: "ifood-import",
    title: "Importação iFood",
    description: "Importe cardápio completo a partir de um link público do iFood em minutos.",
    colSpan: 1 as const,
  },
  {
    id: "physical-menu",
    title: "Menu físico",
    description: "Gere cardápio impresso em A4 ou térmico com templates profissionais.",
    colSpan: 1 as const,
  },
  {
    id: "reports",
    title: "Relatórios e financeiro",
    description: "KPIs, gráficos de vendas, DRE, despesas e lucro por produto.",
    colSpan: 4 as const,
  },
];
