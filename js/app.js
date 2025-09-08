// Applicazione principale CalcioDM3
class CalcioDM3App {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPlayerForRating = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log("Inizializzazione applicazione...");
        
        // Verifica che la configurazione sia disponibile
        if (typeof window.GITHUB_CONFIG === 'undefined') {
            console.error("Configurazione non trovata!");
            this.showNotification("Errore di configurazione. La pagina potrebbe non funzionare correttamente.", "error");
            return;
        }
        
        // Inizializza i manager
        this.githubManager = window.githubManager;
        this.authManager = window.authManager;
        this.playersManager = window.playersManager;
        this.ratingsManager = window.ratingsManager;
        
        // Verifica la connessione a GitHub
        try {
            const isConnected = await this.githubManager.testConnection();
            
            if (!isConnected && this.githubManager.isAuthenticated()) {
                console.warn("Impossibile connettersi a GitHub");
                this.showNotification("Errore di connessione a GitHub. Usando dati locali.", "warning");
            }
        } catch (error) {
            console.error("Errore durante il test di connessione:", error);
        }
        
        // Controlla se l'utente è già loggato
        const userData = this.authManager.getCurrentUser();
        
        if (userData) {
            this.showApp();
            await this.loadDashboard();
        } else {
            this.showLogin();
        }
        
        // Imposta i gestori eventi
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log("Applicazione inizializzata correttamente");
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Aggiungi giocatore form
        const addPlayerForm = document.getElementById('addPlayerForm');
        if (addPlayerForm) {
            addPlayerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddPlayer();
            });
        }
        
        // Cerca giocatori
        const playerSearch = document.getElementById('playerSearch');
        if (playerSearch) {
            playerSearch.addEventListener('input', (e) => {
                this.filterPlayers(e.target.value);
            });
        }
        
        // Menu
