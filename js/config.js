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

  // Cerca il token nell'URL
  function getTokenFromURL() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('token');
    } catch (e) {
      console.error('Errore nel parsing dell URL:', e);
      return '';
    }
  }

  // Configurazione finale - con fallback sicuro
  window.GITHUB_CONFIG = window.GITHUB_CONFIG || {};
  
  // Merge con la configurazione di default
  const configKeys = Object.keys(defaultConfig);
  for (let i = 0; i < configKeys.length; i++) {
    const key = configKeys[i];
    if (window.GITHUB_CONFIG[key] === undefined) {
      window.GITHUB_CONFIG[key] = defaultConfig[key];
    }
  }

  // Sovrascrivi il token se presente nell'URL
  const urlToken = getTokenFromURL();
  if (urlToken) {
    window.GITHUB_CONFIG.token = urlToken;
    console.log('Token impostato dall URL');
  }

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
