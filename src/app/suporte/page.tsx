import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Suporte | Yoself",
  description:
    "Central de suporte do Yoself — cardápio digital para restaurantes. Tire dúvidas, fale conosco e encontre ajuda para clientes e estabelecimentos parceiros.",
};

const SUPPORT_EMAIL = "contato@yo-self.com";

export default function SuportePage() {
  return (
    <LegalPageShell
      title="Suporte"
      description="Estamos aqui para ajudar clientes e restaurantes parceiros que utilizam o Yoself."
    >
      <h2>Contato</h2>
      <p>
        Para dúvidas, problemas técnicos ou solicitações relacionadas ao Yoself,
        entre em contato pelo e-mail:
      </p>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
      <p>
        Respondemos em até <strong>2 dias úteis</strong>. Ao escrever, informe o
        nome do restaurante (se aplicável), descreva o problema e, se possível,
        anexe capturas de tela.
      </p>

      <h2>Para clientes</h2>
      <p>
        O Yoself é o cardápio digital usado em restaurantes parceiros. Para
        acessar o menu, escaneie o QR Code disponível na mesa ou no
        estabelecimento.
      </p>
      <h3>Problemas comuns</h3>
      <ul>
        <li>
          <strong>QR Code não abre o cardápio:</strong> verifique sua conexão com
          a internet e tente escanear novamente. Se o problema persistir, peça
          ajuda ao restaurante.
        </li>
        <li>
          <strong>Pedido ou pagamento:</strong> pagamentos são processados pelo
          restaurante parceiro. Em caso de cobrança indevida ou pedido não
          recebido, contate o estabelecimento primeiro e, se necessário, escreva
          para nós.
        </li>
        <li>
          <strong>Apps YoSelf (iOS e Android):</strong> disponíveis na App Store
          e na Google Play para clientes de restaurantes parceiros. Use o QR
          Code na mesa para vincular o app ao restaurante correto.
        </li>
        <li>
          <strong>Dados pessoais:</strong> consulte nossa{" "}
          <a href="/privacidade">Política de Privacidade</a> ou solicite
          exclusão de dados pelo e-mail acima.
        </li>
      </ul>

      <h2>Para restaurantes</h2>
      <p>
        Se você é dono ou gestor de um estabelecimento e deseja utilizar o
        Yoself, acesse a{" "}
        <a
          href="https://gestor.yo-self.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          área do restaurante
        </a>{" "}
        ou escreva para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
      <p>Podemos ajudar com:</p>
      <ul>
        <li>Cadastro e configuração do cardápio digital</li>
        <li>QR Codes para mesas e delivery</li>
        <li>Integração de pagamentos (cartão, Pix, Apple Pay e Google Pay)</li>
        <li>Assistente de IA e chamada de garçom</li>
        <li>Suporte técnico da plataforma</li>
      </ul>

      <h2>Informações úteis</h2>
      <ul>
        <li>
          <strong>Site:</strong>{" "}
          <a href="https://yo-self.com">yo-self.com</a>
        </li>
        <li>
          <strong>Plataforma para restaurantes:</strong>{" "}
          <a
            href="https://gestor.yo-self.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            gestor.yo-self.com
          </a>
        </li>
        <li>
          <strong>Privacidade:</strong>{" "}
          <a href="/privacidade">Política de Privacidade</a>
        </li>
      </ul>
    </LegalPageShell>
  );
}
