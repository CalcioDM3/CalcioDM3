// Configurazione sicura per GitHub Pages
(function() {
  // Configurazione di fallback per sviluppo
  const defaultConfig = {
    token: '',
    user: 'CalcioDM3',
    repo: 'CalcioDM3',
    playersFolder: 'GIOCATORI',
    ratingsFolder: 'VALUTAZIONI',
    usersFolder: 'UTENTI',
    adminUsers: ['Gianmarco Saponaro', 'Marco D\'Amato']
  };

  // Cerca il token nei secrets di GitHub Pages
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  // Configurazione finale
  const finalConfig = {
    ...defaultConfig,
    token: tokenFromUrl || defaultConfig.token
  };

  // Imposta la configurazione globale
  window.GITHUB_CONFIG = finalConfig;

  // Log di debug
  if (!finalConfig.token) {
    console.warn("Nessun token GitHub rilevato. Funzionalità limitate.");
  } else {
    console.log("Token GitHub rilevato");
  }

  console.log('Configurazione GitHub caricata:', {
    ...finalConfig,
    token: finalConfig.token ? '***' : 'MISSING'
  });
})();
