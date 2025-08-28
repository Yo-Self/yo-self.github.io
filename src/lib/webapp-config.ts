export const WEBAPP_CONFIG = {
  name: 'Restaurant App',
  shortName: 'Restaurant',
  description: 'Aplicativo de restaurante com cardápio digital e pedidos',
  version: '1.0.0',
  themeColor: '#000000',
  backgroundColor: '#ffffff',
  display: 'standalone',
  orientation: 'portrait-primary',
  scope: '/',
  startUrl: '/',
  
  // Configurações de cache
  cache: {
    name: 'restaurant-app-v1',
    urls: [
      '/',
      '/offline',
      '/restaurant',
      '/about',
      '/organization'
    ]
  },
  
  // Configurações de instalação
  install: {
    promptDelay: 3000, // Delay em ms antes de mostrar o prompt
    autoHideDelay: 10000, // Auto-hide após 10s se não instalado
  },
  
  // Configurações de UI
  ui: {
    hideNavigationBars: true,
    preventPullToRefresh: true,
    preventZoom: true,
    safeAreaInsets: true,
  }
};

export const getWebAppMetaTags = () => ({
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'black-translucent',
  'apple-mobile-web-app-title': WEBAPP_CONFIG.name,
  'mobile-web-app-capable': 'yes',
  'theme-color': WEBAPP_CONFIG.themeColor,
  'viewport': 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  'format-detection': 'telephone=no',
  'apple-touch-fullscreen': 'yes',
});

export const getManifestData = () => ({
  name: WEBAPP_CONFIG.name,
  short_name: WEBAPP_CONFIG.shortName,
  description: WEBAPP_CONFIG.description,
  start_url: WEBAPP_CONFIG.startUrl,
  display: WEBAPP_CONFIG.display,
  background_color: WEBAPP_CONFIG.backgroundColor,
  theme_color: WEBAPP_CONFIG.themeColor,
  orientation: WEBAPP_CONFIG.orientation,
  scope: WEBAPP_CONFIG.scope,
  lang: 'pt-BR',
});
