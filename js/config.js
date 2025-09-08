// Configurazione sicura per GitHub Pages
(function() {
  // Configurazione di base
  const defaultConfig = {
    token: '',
    user: 'CalcioDM3',
    repo: 'CalcioDM3',
    playersFolder: 'GIOCATORI',
    ratingsFolder: 'VALUTAZIONI',
    usersFolder: 'UTENTI',
    adminUsers: ['Gianmarco Saponaro', 'Marco D\'Amato']
  };

  // Inizializza GITHUB_CONFIG se non esiste
  if (typeof window.GITHUB_CONFIG === 'undefined') {
    window.GITHUB_CONFIG = {};
  }
  
  // Merge con la configurazione di default
  const configKeys = Object.keys(defaultConfig);
  for (let i = 0; i < configKeys.length; i++) {
    const key = configKeys[i];
    if (window.GITHUB_CONFIG[key] === undefined) {
      window.GITHUB_CONFIG[key] = defaultConfig[key];
    }
  }

  // Verifica finale
  console.log('Configurazione caricata:', {
    user: window.GITHUB_CONFIG.user,
    repo: window.GITHUB_CONFIG.repo,
    playersFolder: window.GITHUB_CONFIG.playersFolder,
    ratingsFolder: window.GITHUB_CONFIG.ratingsFolder,
    usersFolder: window.GITHUB_CONFIG.usersFolder,
    adminUsers: window.GITHUB_CONFIG.adminUsers,
    token: window.GITHUB_CONFIG.token ? '***' : 'MISSING'
  });
})();
