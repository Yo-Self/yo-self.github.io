import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./scroll-animations.css";
import "./tailwind.css";
import "./webapp.css";
import { AccessibilityProvider } from "@/components/AccessibilityContext";
import { CartProvider } from "@/context/CartContext";
import Analytics from "@/components/Analytics";
import Navigation from "@/components/Navigation";
import ThemeScript from "@/components/ThemeScript";
import CartModal from "@/components/CartModal";
import InstallPrompt from "@/components/InstallPrompt";
import DynamicMetaTags from "@/components/DynamicMetaTags";
import StartupRedirect from "@/components/StartupRedirect";
import A2HSUrlTagger from "@/components/A2HSUrlTagger";

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
        {/* Favicon default links kept minimal; route-specific pages override dynamically */}
        <link rel="icon" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/og-image.png" />
        
        {/* Web App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Restaurant" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        {/* iOS specific */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-white dark:bg-black text-gray-900 dark:text-white webapp-container`}>
        <AccessibilityProvider>
          <CartProvider>
            <ThemeScript />
            <Navigation />
            {children}
            {/* Componentes globais do carrinho */}
            <CartModal />
            <InstallPrompt />
            <DynamicMetaTags />
            <StartupRedirect />
            <A2HSUrlTagger />
          </CartProvider>
        </AccessibilityProvider>
        <Analytics />
      </body>
    </html>
  );
}
