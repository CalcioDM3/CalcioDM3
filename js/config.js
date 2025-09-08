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

  // Funzione per estrarre il token dall'URL
  function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  }

  // Funzione per verificare la validità del token
  async function validateToken(token) {
    if (!token) return false;
    
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Errore nella validazione del token:', error);
      return false;
    }
  }

  // Caricamento e validazione del token
  async function initializeConfig() {
    let finalToken = '';
    
    // 1. Prova a ottenere il token dall'URL
    const urlToken = getTokenFromURL();
    if (urlToken) {
      console.log('Token rilevato dall URL');
      finalToken = urlToken;
    }
    
    // 2. Se non c'è token nell'URL, usa il token incorporato
    if (!finalToken) {
      finalToken = defaultConfig.token;
    }
    
    // 3. Valida il token
    const isValid = await validateToken(finalToken);
    
    if (!isValid && finalToken) {
      console.warn('Token non valido. Modalità sviluppo attivata.');
      finalToken = '';
    }
    
    // Configurazione finale
    window.GITHUB_CONFIG = {
      ...defaultConfig,
      token: finalToken
    };
    
    console.log('Configurazione caricata:', {
      ...window.GITHUB_CONFIG,
      token: window.GITHUB_CONFIG.token ? '***' : 'MISSING'
    });
  }

  // Esegui l'inizializzazione
  initializeConfig();
})();
