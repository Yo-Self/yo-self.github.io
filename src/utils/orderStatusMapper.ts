export function getStatusEmoji(status: string): string {
  switch (status) {
    case "pending_payment": return "💳";
    case "pending": case "new": return "📥";
    case "preparing": case "in_preparation": return "🍳";
    case "ready": return "🥡";
    case "delivering": return "🛵";
    case "completed": case "finished": return "🎉";
    case "cancelled": return "❌";
    default: return "⏳";
  }
}

export function getStatusEmojiWithType(status: string, deliveryType?: string): string {
  if (status === "ready" && deliveryType === "delivery") {
    return "🛵";
  }
  return getStatusEmoji(status);
}

export function getStatusTitle(status: string, deliveryType?: string): string {
  switch (status) {
    case "pending_payment": return "Aguardando Pagamento";
    case "pending": case "new": return "Pedido Recebido";
    case "preparing": case "in_preparation": return "Em Preparação";
    case "ready": 
      return deliveryType === "delivery" ? "Saiu para entrega" : "Pronto!";
    case "delivering": return "A Caminho";
    case "completed": case "finished": return "Entregue";
    case "cancelled": return "Pedido Cancelado";
    default: return "Processando";
  }
}

export function getStatusDescription(status: string, deliveryType?: string): string {
  switch (status) {
    case "pending_payment": return "Seu pagamento online via Stripe está sendo processado.";
    case "pending": case "new": return "O restaurante recebeu seu pedido e já vai iniciar o preparo.";
    case "preparing": case "in_preparation": return "Nosso chef está preparando seu pedido com muito carinho.";
    case "ready": 
      return deliveryType === "delivery" 
        ? "O entregador já coletou seu pedido e está a caminho."
        : "Seu pedido está pronto! Retire no balcão ou aguarde o garçom.";
    case "delivering": return "O entregador já coletou seu pedido e está a caminho.";
    case "completed": case "finished": return "Aproveite a sua refeição! Obrigado por pedir com o YoSelf.";
    case "cancelled": return "Infelizmente, este pedido foi cancelado pelo restaurante.";
    default: return "Estamos atualizando o status do seu pedido...";
  }
}

export function getProgressValue(status: string, deliveryType?: string): number {
  switch (status) {
    case "pending_payment": return 0.1;
    case "pending": case "new": return 0.25;
    case "preparing": case "in_preparation": return 0.5;
    case "ready": return 0.75;
    case "delivering": return 0.9;
    case "completed": case "finished": return 1.0;
    default: return 0.0;
  }
}
