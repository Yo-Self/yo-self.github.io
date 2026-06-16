import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Política de Privacidade | Yoself",
  description:
    "Saiba como o Yoself coleta, usa e protege seus dados pessoais em conformidade com a LGPD.",
};

const PRIVACY_EMAIL = "contato@yo-self.com";
const LAST_UPDATED = "16 de junho de 2026";

export default function PrivacidadePage() {
  return (
    <LegalPageShell
      title="Política de Privacidade"
      description={`Última atualização: ${LAST_UPDATED}`}
    >
      <p>
        Esta Política de Privacidade descreve como o <strong>Yoself</strong>{" "}
        (&quot;nós&quot;, &quot;nosso&quot;) trata dados pessoais quando você
        utiliza nosso site (<a href="https://yo-self.com">yo-self.com</a>), os
        aplicativos YoSelf para iOS e Android e os cardápios digitais de
        restaurantes parceiros.
      </p>
      <p>
        Ao usar nossos serviços, você concorda com as práticas descritas nesta
        política. Em caso de dúvidas, entre em contato:{" "}
        <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
      </p>

      <h2>1. Quem somos</h2>
      <p>
        O Yoself é uma plataforma de cardápio digital para restaurantes. Os
        serviços são operados por Yo Self. O controlador dos dados descritos
        nesta política pode ser contatado pelo e-mail{" "}
        <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
      </p>

      <h2>2. Dados que coletamos</h2>
      <h3>2.1 Dados fornecidos por você</h3>
      <ul>
        <li>Nome, telefone e WhatsApp (para pedidos e entregas)</li>
        <li>Endereço de entrega (quando utiliza o modo delivery)</li>
        <li>Itens do pedido, complementos e observações</li>
        <li>Mensagens enviadas ao assistente de IA do cardápio</li>
      </ul>

      <h3>2.2 Dados coletados automaticamente</h3>
      <ul>
        <li>Identificador de mesa (quando escaneia QR Code com parâmetro de mesa)</li>
        <li>Localização aproximada (apenas se você autorizar, para delivery)</li>
        <li>Dados de uso: páginas visitadas, cliques, tempo de sessão e eventos de navegação</li>
        <li>Informações técnicas: tipo de dispositivo, navegador, sistema operacional e endereço IP</li>
        <li>Identificadores de sessão e cookies ou armazenamento local do navegador</li>
      </ul>

      <h3>2.3 Dados de pagamento</h3>
      <p>
        Pagamentos com cartão, Pix, Apple Pay e Google Pay são processados por
        provedores terceiros (como Stripe). <strong>Não armazenamos</strong>{" "}
        números completos de cartão de crédito em nossos servidores. Recebemos
        apenas confirmações de pagamento e identificadores necessários para
        concluir o pedido.
      </p>

      <h2>3. Como usamos seus dados</h2>
      <ul>
        <li>Exibir o cardápio e processar seus pedidos</li>
        <li>Enviar informações do pedido ao restaurante parceiro</li>
        <li>Processar pagamentos e prevenir fraudes</li>
        <li>Responder perguntas via assistente de IA sobre o cardápio</li>
        <li>Melhorar a experiência, desempenho e segurança da plataforma</li>
        <li>Gerar estatísticas de uso (analytics) de forma agregada</li>
        <li>Cumprir obrigações legais e responder a solicitações de autoridades</li>
      </ul>

      <h2>4. Base legal (LGPD)</h2>
      <p>Tratamos dados pessoais com base em:</p>
      <ul>
        <li>
          <strong>Execução de contrato ou procedimentos preliminares:</strong>{" "}
          para processar pedidos solicitados por você
        </li>
        <li>
          <strong>Consentimento:</strong> localização, gravações de sessão de
          analytics e comunicações opcionais
        </li>
        <li>
          <strong>Legítimo interesse:</strong> segurança, prevenção a fraudes e
          melhoria dos serviços
        </li>
        <li>
          <strong>Obrigação legal:</strong> quando exigido por lei
        </li>
      </ul>

      <h2>5. Compartilhamento de dados</h2>
      <p>Podemos compartilhar dados com:</p>
      <ul>
        <li>
          <strong>Restaurantes parceiros:</strong> para preparar e entregar seu
          pedido
        </li>
        <li>
          <strong>Provedores de infraestrutura:</strong> hospedagem, banco de
          dados (Supabase) e processamento de pagamentos (Stripe)
        </li>
        <li>
          <strong>Provedores de analytics:</strong> PostHog, para entender o uso
          da plataforma (incluindo gravações de sessão, quando habilitadas)
        </li>
        <li>
          <strong>Provedores de IA:</strong> Google (Gemini), para responder
          perguntas sobre o cardápio — sem incluir dados de pagamento
        </li>
        <li>
          <strong>WhatsApp:</strong> quando você opta por finalizar o pedido por
          esse canal
        </li>
      </ul>
      <p>
        Não vendemos seus dados pessoais. Exigimos que parceiros tratem os dados
        apenas para as finalidades contratadas e com medidas de segurança
        adequadas.
      </p>

      <h2>6. Armazenamento e retenção</h2>
      <p>
        Dados de pedido e cadastro são mantidos pelo tempo necessário para
        cumprir a finalidade do serviço e obrigações legais. Dados de navegação
        em analytics podem ser retidos conforme a configuração dos provedores.
        No navegador, alguns dados (como nome e endereço) podem ficar salvos
        localmente para facilitar pedidos futuros — você pode limpá-los nas
        configurações do navegador.
      </p>
      <p>
        Nos aplicativos móveis YoSelf (iOS e Android), dados de entrega podem
        ser armazenados de forma segura no dispositivo (Keychain no iOS e
        armazenamento criptografado no Android) para autopreenchimento.
      </p>

      <h2>7. Cookies e tecnologias similares</h2>
      <p>
        Utilizamos cookies, localStorage e tecnologias equivalentes para manter
        sua sessão, lembrar preferências, salvar itens do carrinho e medir o uso
        da plataforma. Você pode gerenciar cookies nas configurações do seu
        navegador, mas algumas funcionalidades podem deixar de funcionar
        corretamente.
      </p>

      <h2>8. Seus direitos</h2>
      <p>
        Nos termos da Lei Geral de Proteção de Dados (LGPD), você pode
        solicitar:
      </p>
      <ul>
        <li>Confirmação e acesso aos seus dados</li>
        <li>Correção de dados incompletos ou desatualizados</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
        <li>Portabilidade dos dados</li>
        <li>Revogação do consentimento</li>
        <li>Informação sobre compartilhamentos realizados</li>
      </ul>
      <p>
        Para exercer seus direitos, envie um e-mail para{" "}
        <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. Podemos
        solicitar informações adicionais para confirmar sua identidade.
      </p>

      <h2>9. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais para proteger seus dados,
        incluindo conexões criptografadas (HTTPS), controle de acesso e
        processamento de pagamentos por provedores certificados. Nenhum sistema
        é 100% seguro; em caso de incidente relevante, notificaremos conforme
        exigido pela lei.
      </p>

      <h2>10. Menores de idade</h2>
      <p>
        Nossos serviços não são direcionados a menores de 18 anos. Não coletamos
        intencionalmente dados de crianças. Se tomarmos conhecimento de coleta
        indevida, excluiremos os dados o mais rápido possível.
      </p>

      <h2>11. Transferência internacional</h2>
      <p>
        Alguns provedores (como PostHog, Stripe, Google e Supabase) podem
        processar dados em servidores fora do Brasil. Nesses casos, adotamos
        salvaguardas compatíveis com a LGPD.
      </p>

      <h2>12. Alterações nesta política</h2>
      <p>
        Podemos atualizar esta política periodicamente. A data da última
        revisão será indicada no topo da página. Alterações relevantes podem ser
        comunicadas pelo site ou por outros meios apropriados.
      </p>

      <h2>13. Contato</h2>
      <p>
        Dúvidas sobre privacidade ou solicitações relacionadas a dados pessoais:
      </p>
      <ul>
        <li>
          E-mail: <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
        </li>
        <li>
          Suporte: <a href="/suporte">página de suporte</a>
        </li>
      </ul>
    </LegalPageShell>
  );
}
