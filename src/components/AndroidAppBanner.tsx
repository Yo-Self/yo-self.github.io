"use client";

import React, { useEffect, useMemo, useState } from "react";

const ANDROID_PACKAGE = "com.yoself.app";
const PLAY_STORE_BASE =
  "https://play.google.com/store/apps/details?id=com.yoself.app";
const DISMISS_KEY = "yoself_android_banner_dismissed";

/** Matches restaurant slugs created in the gestor (lowercase alphanumeric + hyphens). */
export const RESTAURANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidRestaurantSlug(slug: string): boolean {
  return RESTAURANT_SLUG_PATTERN.test(slug);
}

function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

function buildRestaurantPath(slug: string, isDelivery: boolean): string {
  const segment = isDelivery ? "delivery" : "restaurant";
  return `/${segment}/${encodeURIComponent(slug)}`;
}

function buildPlayStoreUrl(slug: string, isDelivery: boolean): string {
  const referrer = encodeURIComponent(
    `slug=${slug}&delivery=${isDelivery ? "1" : "0"}`
  );
  return `${PLAY_STORE_BASE}&referrer=${referrer}`;
}

function buildIntentUrl(slug: string, isDelivery: boolean): string {
  const path = buildRestaurantPath(slug, isDelivery);
  const fallback = encodeURIComponent(
    buildPlayStoreUrl(slug, isDelivery)
  );
  return `intent://yo-self.com${path}#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
}

interface AndroidAppBannerProps {
  slug: string;
  isDelivery?: boolean;
}

export default function AndroidAppBanner({
  slug,
  isDelivery = false,
}: AndroidAppBannerProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const safeSlug = isValidRestaurantSlug(slug) ? slug : null;

  const appUrl = useMemo(
    () => (safeSlug ? `https://yo-self.com${buildRestaurantPath(safeSlug, isDelivery)}` : ""),
    [safeSlug, isDelivery]
  );
  const playStoreUrl = useMemo(
    () => (safeSlug ? buildPlayStoreUrl(safeSlug, isDelivery) : ""),
    [safeSlug, isDelivery]
  );
  const intentUrl = useMemo(
    () => (safeSlug ? buildIntentUrl(safeSlug, isDelivery) : ""),
    [safeSlug, isDelivery]
  );

  useEffect(() => {
    if (!safeSlug || !isAndroidDevice()) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
      return;
    }
    setVisible(true);
  }, [safeSlug]);

  useEffect(() => {
    if (!safeSlug || !isAndroidDevice()) return;
    const link = document.createElement("link");
    link.rel = "alternate";
    link.href = `android-app://${ANDROID_PACKAGE}/https/yo-self.com${buildRestaurantPath(safeSlug, isDelivery)}`;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [safeSlug, isDelivery]);

  if (!safeSlug || !visible || dismissed) return null;

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const handleOpenApp = () => {
    window.location.href = intentUrl;
  };

  const handleInstall = () => {
    window.location.href = playStoreUrl;
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9998] px-4 pb-4 pointer-events-none">
      <div className="mx-auto max-w-lg rounded-2xl border border-cyan-500/30 bg-white/95 dark:bg-gray-900/95 shadow-xl backdrop-blur p-4 pointer-events-auto">
        <div className="flex items-start gap-3">
          <img
            src="/yoself.png"
            alt="YoSelf"
            className="h-12 w-12 rounded-xl border border-gray-200 dark:border-gray-700"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Abra no app YoSelf
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Experiência nativa com pedidos, pagamento e notificações.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleOpenApp}
                className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 transition-colors"
              >
                Abrir no app
              </button>
              <a
                href={playStoreUrl}
                onClick={(event) => {
                  event.preventDefault();
                  handleInstall();
                }}
                className="rounded-lg border border-cyan-600 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950 transition-colors"
              >
                Instalar
              </a>
              <a
                href={appUrl}
                className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Continuar na web
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fechar"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
