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

  // Carica la configurazione in modo sicuro
  if (typeof window.GITHUB_CONFIG === 'undefined') {
    window.GITHUB_CONFIG = defaultConfig;
    console.warn("Configurazione di fallback attivata - Modalità sviluppo");
  }

  // Verifica che il token sia valido
  if (window.GITHUB_CONFIG.token) {
    console.log("Token GitHub rilevato");
  } else {
    console.warn("Nessun token GitHub rilevato. Funzionalità limitate.");
  }

  console.log('Configurazione GitHub caricata:', {
    ...window.GITHUB_CONFIG,
    token: window.GITHUB_CONFIG.token ? '***' : 'MISSING'
  });
})();
