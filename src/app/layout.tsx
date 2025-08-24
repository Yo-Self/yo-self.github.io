import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./scroll-animations.css";
import { AccessibilityProvider } from "@/components/AccessibilityContext";
import { CartProvider } from "@/context/CartContext";
import Analytics from "@/components/Analytics";
import Navigation from "@/components/Navigation";
import ThemeScript from "@/components/ThemeScript";
import CartModal from "@/components/CartModal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://yo-self.github.io"),
  title: "Restaurant Menu",
  description: "Digital menu for restaurants",
  icons: {
    icon: [
      { url: "/yoself.png", sizes: "any", type: "image/png" },
    ],
    apple: "/yoself.png",
    shortcut: "/yoself.png",
  },
  openGraph: {
    title: "Restaurant Menu",
    description: "Digital menu for restaurants",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant Menu",
    description: "Digital menu for restaurants",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/yoself.png" type="image/png" />
        <link rel="shortcut icon" href="/yoself.png" />
        <link rel="apple-touch-icon" href="/yoself.png" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/og-image.png" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-white dark:bg-black text-gray-900 dark:text-white`}>
        <AccessibilityProvider>
          <CartProvider>
            <ThemeScript />
            <Navigation />
            {children}
            {/* Componentes globais do carrinho */}
            <CartModal />
          </CartProvider>
        </AccessibilityProvider>
        <Analytics />
      </body>
    </html>
  );
}
