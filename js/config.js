// Configurazione di fallback per sviluppo
if (typeof window.GITHUB_CONFIG === 'undefined') {
  window.GITHUB_CONFIG = {
    token: '',
    user: 'CalcioDM3',
    repo: 'CalcioDM3',
    playersFolder: 'GIOCATORI',
    ratingsFolder: 'VALUTAZIONI',
    usersFolder: 'UTENTI',
    adminUsers: ['Gianmarco Saponaro', 'Marco D\'Amato']
  };
}

// Esporta le variabili globali per compatibilità
const GITHUB_TOKEN = window.GITHUB_CONFIG.token;
const GITHUB_USER = window.GITHUB_CONFIG.user;
const GITHUB_REPO = window.GITHUB_CONFIG.repo;
const PLAYERS_FOLDER = window.GITHUB_CONFIG.playersFolder;
const RATINGS_FOLDER = window.GITHUB_CONFIG.ratingsFolder;
const USERS_FOLDER = window.GITHUB_CONFIG.usersFolder;
const ADMIN_USERS = window.GITHUB_CONFIG.adminUsers;
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents`;

console.log('Configurazione GitHub:', window.GITHUB_CONFIG);
