// Configurazione dell'applicazione
// Questo file viene generato automaticamente da GitHub Actions

// In produzione, queste variabili vengono impostate dal workflow di GitHub Actions
// In sviluppo, vengono usati i valori di default o quelli da config.local.js

// Configurazione di base
const GITHUB_USER = typeof GITHUB_USER !== 'undefined' ? GITHUB_USER : 'CalcioDM3';
const GITHUB_REPO = typeof GITHUB_REPO !== 'undefined' ? GITHUB_REPO : 'CalcioDM3';

// Token GitHub (viene iniettato durante il build)
const GITHUB_TOKEN = typeof GITHUB_TOKEN !== 'undefined' ? GITHUB_TOKEN : '';

// Cartelle nel repository
const PLAYERS_FOLDER = 'GIOCATORI';
const RATINGS_FOLDER = 'VALUTAZIONI';
const USERS_FOLDER = 'UTENTI';

// Utenti admin
const ADMIN_USERS = ["Gianmarco Saponaro", "Marco D'Amato"];

// URL base per le API GitHub
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents`;

console.log('Configurazione caricata:', {
    GITHUB_USER,
    GITHUB_REPO,
    HAS_TOKEN: !!GITHUB_TOKEN,
    API_BASE: GITHUB_API_BASE
});
