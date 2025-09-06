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
        this.githubManager = new GitHubManager();
        this.authManager = new AuthManager();
        this.playersManager = new PlayersManager();
        this.ratingsManager = new RatingsManager();
        
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
        
        // Menu mobile
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                document.getElementById('mobileMenu').classList.remove('hidden');
            });
        }
        
        const closeMobileMenu = document.getElementById('closeMobileMenu');
        if (closeMobileMenu) {
            closeMobileMenu.addEventListener('click', () => {
                document.getElementById('mobileMenu').classList.add('hidden');
            });
        }
    }

    async handleLogin() {
        const nome = document.getElementById('nome').value.trim();
        const cognome = document.getElementById('cognome').value.trim();
        const pin = document.getElementById('pin').value.trim();
        
        if (!nome || !cognome || !pin) {
            this.showNotification("Inserisci nome, cognome e PIN", "error");
            return;
        }
        
        const loginButton = document.querySelector('#loginForm button[type="submit"]');
        const originalText = loginButton.innerHTML;
        loginButton.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Accesso in corso...';
        loginButton.disabled = true;
        
        try {
            const result = await this.authManager.login(nome, cognome, pin);
            
            if (result.success) {
                this.showApp();
                await this.loadDashboard();
                this.showNotification("Accesso effettuato con successo!", "success");
            } else {
                this.showNotification(result.error, "error");
            }
        } catch (error) {
            console.error("Errore durante l'accesso:", error);
            this.showNotification("Errore durante l'accesso", "error");
        } finally {
            loginButton.innerHTML = originalText;
            loginButton.disabled = false;
        }
    }

    showLogin() {
        const loginPage = document.getElementById('loginPage');
        const appContainer = document.getElementById('appContainer');
        
        if (loginPage) loginPage.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
    }

    showApp() {
        const loginPage = document.getElementById('loginPage');
        const appContainer = document.getElementById('appContainer');
        
        if (loginPage) loginPage.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        
        // Carica il contenuto della dashboard
        this.loadDashboardContent();
    }

    async loadDashboard() {
        console.log("Caricamento dashboard...");
        
        try {
            // Carica i giocatori
            await this.playersManager.loadPlayers();
            
            // Carica le valutazioni condivise
            await this.ratingsManager.loadSharedRatings();
            
            // Aggiorna la dashboard
            this.updateDashboard();
            
            console.log("Dashboard caricata correttamente");
        } catch (error) {
            console.error("Errore nel caricamento della dashboard:", error);
            this.showNotification("Errore nel caricamento dei dati", "error");
        }
    }

    updateDashboard() {
        try {
            const players = this.playersManager.getPlayers();
            const ratingsCount = this.ratingsManager.getRatingsCount();
            
            // Aggiorna i contatori
            const playersCountEl = document.getElementById('playersCount');
            const ratingsCountEl = document.getElementById('ratingsCount');
            
            if (playersCountEl) playersCountEl.textContent = players.length;
            if (ratingsCountEl) ratingsCountEl.textContent = ratingsCount;
            
            // Mostra giocatori recenti
            this.showRecentPlayers(players.slice(0, 3));
            
            // Controlla se l'utente è admin
            const user = this.authManager.getCurrentUser();
            if (user && user.isAdmin) {
                const adminSection = document.getElementById('adminSection');
                const adminButton = document.getElementById('adminButton');
                const mobileAdminSection = document.getElementById('mobileAdminSection');
                
                if (adminSection) adminSection.style.display = 'block';
                if (adminButton) adminButton.style.display = 'block';
                if (mobileAdminSection) mobileAdminSection.style.display = 'block';
            }
            
            // Aggiorna il nome utente
            if (user) {
                const userNameEl = document.getElementById('userName');
                const mobileUserNameEl = document.getElementById('mobileUserName');
                const mobileMenuUserNameEl = document.getElementById('mobileMenuUserName');
                
                if (userNameEl) userNameEl.textContent = user.nome;
                if (mobileUserNameEl) mobileUserNameEl.textContent = user.nome;
                if (mobileMenuUserNameEl) mobileMenuUserNameEl.textContent = user.nome;
            }
        } catch (error) {
            console.error("Errore nell'aggiornamento della dashboard:", error);
        }
    }

    showRecentPlayers(players) {
        const container = document.getElementById('recentPlayers');
        if (!container) return;
        
        if (players.length === 0) {
            container.innerHTML = '<p class="text-gray-500">Nessun giocatore disponibile</p>';
            return;
        }
        
        container.innerHTML = players.map(player => `
            <div class="flex items-center">
                <img src="${player.image_url || 'https://via.placeholder.com/80'}" alt="${player.nome} ${player.cognome}" class="player-image">
                <div class="ml-4">
                    <h4 class="font-semibold">${player.nome} ${player.cognome}</h4>
                </div>
            </div>
        `).join('');
    }

    showSection(sectionName) {
        // Nascondi tutte le sezioni
        const sections = document.querySelectorAll('[id$="Section"]');
        sections.forEach(section => {
            section.classList.add('hidden');
        });
        
        // Mostra la sezione richiesta
        const targetSection = document.getElementById(sectionName + 'Section');
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        this.currentSection = sectionName;
        
        // Carica il contenuto specifico della sezione
        if (sectionName === 'players') {
            this.showPlayersList();
        } else if (sectionName === 'ratings') {
            this.showRatingsList();
        } else if (sectionName === 'admin') {
            this.showAdminPanel();
        }
        
        // Chiudi il menu mobile se aperto
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
        }
    }

    async showPlayersList() {
        const container = document.getElementById('playersList');
        if (!container) return;
        
        try {
            const players = this.playersManager.getPlayers();
            
            if (players.length === 0) {
                container.innerHTML = '<p class="text-gray-500 col-span-3 text-center py-8">Nessun giocatore disponibile</p>';
                return;
            }
            
            container.innerHTML = players.map(player => `
                <div class="player-card card p-4 text-center">
                    <img src="${player.image_url || 'https://via.placeholder.com/150'}" alt="${player.nome} ${player.cognome}" class="player-image mx-auto mb-3">
                    <h3 class="font-semibold">${player.nome} ${player.cognome}</h3>
                </div>
            `).join('');
        } catch (error) {
            console.error("Errore nel caricamento della lista giocatori:", error);
            container.innerHTML = '<p class="text-gray-500 col-span-3 text-center py-8">Errore nel caricamento dei giocatori</p>';
        }
    }

    async showRatingsList() {
        const container = document.getElementById('ratingsList');
        if (!container) return;
        
        try {
            const players = this.playersManager.getPlayers();
            
            if (players.length === 0) {
                container.innerHTML = '<p class="text-gray-500 col-span-3 text-center py-8">Nessun giocatore disponibile</p>';
                return;
            }
            
            container.innerHTML = players.map(player => {
                const rating = this.ratingsManager.getPlayerRating(player.id);
                
                return `
                    <div class="player-card card p-4 text-center cursor-pointer" onclick="app.ratePlayer(${player.id})">
                        <img src="${player.image_url || 'https://via.placeholder.com/150'}" alt="${player.nome} ${player.cognome}" class="player-image mx-auto mb-3">
                        <h3 class="font-semibold">${player.nome} ${player.cognome}</h3>
                        ${rating ? `
                            <div class="mt-2">
                                <span class="text-sm text-green-600">Già valutato</span>
                                <div class="text-xs text-gray-500">${new Date(rating.timestamp).toLocaleDateString()}</div>
                            </div>
                        ` : `
                            <div class="mt-2 text-sm text-gray-500">Clicca per valutare</div>
                        `}
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error("Errore nel caricamento della lista valutazioni:", error);
            container.innerHTML = '<p class="text-gray-500 col-span-3 text-center py-8">Errore nel caricamento delle valutazioni</p>';
        }
    }

    ratePlayer(playerId) {
        const player = this.playersManager.getPlayerById(playerId);
        if (!player) return;
        
        this.currentPlayerForRating = player;
        
        // Mostra il modal di valutazione
        const ratingPlayerName = document.getElementById('ratingPlayerName');
        if (ratingPlayerName) {
            ratingPlayerName.textContent = `Valuta ${player.nome} ${player.cognome}`;
        }
        
        // Resetta le skill
        const skillsContainer = document.getElementById('ratingSkills');
        if (!skillsContainer) return;
        
        skillsContainer.innerHTML = '';
        
        // Aggiungi le skill
        const skills = ['Tiro', 'Velocità', 'Tecnica', 'Difesa', 'Fisico', 'Visione'];
        const currentRating = this.ratingsManager.getPlayerRating(playerId);
        
        skills.forEach(skill => {
            const value = currentRating ? currentRating[skill] || 50 : 50;
            
            skillsContainer.innerHTML += `
                <div>
                    <label class="block text-sm font-medium mb-1">${skill}</label>
                    <input type="range" min="0" max="100" value="${value}" class="skill-slider" id="skill-${skill}" data-skill="${skill}">
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>0</span>
                        <span id="value-${skill}">${value}</span>
                        <span>100</span>
                    </div>
                </div>
            `;
        });
        
        // Aggiorna i valori quando gli slider cambiano
        skills.forEach(skill => {
            const slider = document.getElementById(`skill-${skill}`);
            const valueDisplay = document.getElementById(`value-${skill}`);
            
            if (slider && valueDisplay) {
                slider.addEventListener('input', () => {
                    valueDisplay.textContent = slider.value;
                });
            }
        });
        
        // Mostra il modal
        const ratingModal = document.getElementById('ratingModal');
        if (ratingModal) {
            ratingModal.classList.remove('hidden');
        }
    }

    closeRatingModal() {
        const ratingModal = document.getElementById('ratingModal');
        if (ratingModal) {
            ratingModal.classList.add('hidden');
        }
        this.currentPlayerForRating = null;
    }

    savePlayerRating() {
        if (!this.currentPlayerForRating) return;
        
        const skills = ['Tiro', 'Velocità', 'Tecnica', 'Difesa', 'Fisico', 'Visione'];
        const ratings = {};
        
        skills.forEach(skill => {
            const slider = document.getElementById(`skill-${skill}`);
            if (slider) {
                ratings[skill] = parseInt(slider.value);
            }
        });
        
        // Salva la valutazione
        this.ratingsManager.ratePlayer(this.currentPlayerForRating.id, ratings);
        
        // Chiudi il modal
        this.closeRatingModal();
        
        // Mostra conferma
        this.showNotification("Valutazione salvata con successo!", "success");
        
        // Aggiorna la lista se siamo nella sezione valutazioni
        if (this.currentSection === 'ratings') {
            this.showRatingsList();
        }
        
        // Aggiorna la dashboard
        this.updateDashboard();
    }

    async shareRatings() {
        try {
            const result = await this.ratingsManager.shareRatings();
            
            if (result.success) {
                this.showNotification(result.message, "success");
            } else {
                this.showNotification(result.error, "error");
            }
        } catch (error) {
            console.error("Errore nella condivisione delle valutazioni:", error);
            this.showNotification("Errore nella condivisione delle valutazioni", "error");
        }
    }

    async handleAddPlayer() {
        const nomeInput = document.getElementById('newPlayerName');
        const cognomeInput = document.getElementById('newPlayerSurname');
        const imageInput = document.getElementById('newPlayerImage');
        
        if (!nomeInput || !cognomeInput) return;
        
        const nome = nomeInput.value.trim();
        const cognome = cognomeInput.value.trim();
        const imageFile = imageInput ? imageInput.files[0] : null;
        
        if (!nome || !cognome) {
            this.showNotification("Inserisci nome e cognome", "error");
            return;
        }
        
        const submitButton = document.querySelector('#addPlayerForm button[type="submit"]');
        if (!submitButton) return;
        
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Aggiungendo...';
        submitButton.disabled = true;
        
        try {
            const result = await this.playersManager.addPlayer(nome, cognome, imageFile);
            
            if (result.success) {
                this.showNotification("Giocatore aggiunto con successo!", "success");
                
                // Resetta il form
                const addPlayerForm = document.getElementById('addPlayerForm');
                if (addPlayerForm) addPlayerForm.reset();
                
                // Aggiorna le liste
                this.showPlayersList();
                this.showRatingsList();
                this.updateDashboard();
            } else {
                this.showNotification(result.error, "error");
            }
        } catch (error) {
            console.error("Errore nell'aggiunta del giocatore:", error);
            this.showNotification("Errore nell'aggiunta del giocatore", "error");
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    showAdminPanel() {
        const container = document.getElementById('adminPlayersList');
        if (!container) return;
        
        try {
            const players = this.playersManager.getPlayers();
            
            if (players.length === 0) {
                container.innerHTML = '<p class="text-gray-500">Nessun giocatore disponibile</p>';
                return;
            }
            
            container.innerHTML = players.map(player => `
                <div class="flex items-center justify-between p-3 border-b">
                    <div class="flex items-center">
                        <img src="${player.image_url || 'https://via.placeholder.com/50'}" alt="${player.nome} ${player.cognome}" class="w-10 h-10 rounded-full mr-3">
                        <span>${player.nome} ${player.cognome}</span>
                    </div>
                    <button onclick="app.deletePlayer(${player.id})" class="text-red-600 hover:text-red-800">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error("Errore nel caricamento del pannello admin:", error);
            container.innerHTML = '<p class="text-gray-500">Errore nel caricamento dei giocatori</p>';
        }
    }

    async deletePlayer(playerId) {
        if (!confirm("Sei sicuro di voler eliminare questo giocatore?")) {
            return;
        }
        
        try {
            const result = await this.playersManager.deletePlayer(playerId);
            
            if (result.success) {
                this.showNotification("Giocatore eliminato con successo!", "success");
                
                // Aggiorna le liste
                this.showPlayersList();
                this.showRatingsList();
                this.showAdminPanel();
                this.updateDashboard();
            } else {
                this.showNotification(result.error, "error");
            }
        } catch (error) {
            console.error("Errore nell'eliminazione del giocatore:", error);
            this.showNotification("Errore nell'eliminazione del giocatore", "error");
        }
    }

    filterPlayers(query) {
        const container = document.getElementById('playersList');
        if (!container) return;
        
        try {
            const filteredPlayers = this.playersManager.searchPlayers(query);
            
            if (filteredPlayers.length === 0) {
                container.innerHTML = '<p class="text-gray-500 col-span-3 text-center py-8">Nessun giocatore trovato</p>';
                return;
            }
            
            container.innerHTML = filteredPlayers.map(player => `
                <div class="player-card card p-4 text-center">
                    <img src="${player.image_url || 'https://via.placeholder.com/150'}" alt="${player.nome} ${player.cognome}" class="player-image mx-auto mb-3">
                    <h3 class="font-semibold">${player.nome} ${player.cognome}</h3>
                </div>
            `).join('');
        } catch (error) {
            console.error("Errore nel filtraggio dei giocatori:", error);
        }
    }

    async refreshData() {
        try {
            await this.loadDashboard();
            this.showNotification("Dati aggiornati con successo!", "success");
        } catch (error) {
            console.error("Errore nell'aggiornamento dei dati:", error);
            this.showNotification("Errore nell'aggiornamento dei dati", "error");
        }
    }

    showNotification(message, type = 'info') {
        // Crea un elemento di notifica
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-100 text-green-800' : 
            type === 'error' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fa-solid ${
                    type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-info-circle'
                } mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Aggiungi al documento
        document.body.appendChild(notification);
        
        // Rimuovi dopo 3 secondi
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    loadDashboardContent() {
        // Questo metodo caricherà il contenuto della dashboard dal file esterno
        // Per ora è vuoto, il contenuto è già nel file HTML
    }
}

// Funzioni globali per l'accesso da HTML
function showSection(sectionName) {
    if (window.app) {
        window.app.showSection(sectionName);
    }
}

function logout() {
    if (window.authManager) {
        window.authManager.logout();
    }
    if (window.app) {
        window.app.showLogin();
    }
}

function shareRatings() {
    if (window.app) {
        window.app.shareRatings();
    }
}

function refreshData() {
    if (window.app) {
        window.app.refreshData();
    }
}

function closeRatingModal() {
    if (window.app) {
        window.app.closeRatingModal();
    }
}

function savePlayerRating() {
    if (window.app) {
        window.app.savePlayerRating();
    }
}

// Inizializza l'app quando il DOM è pronto
let app;

document.addEventListener('DOMContentLoaded', () => {
    // Verifica che la configurazione sia disponibile
    if (typeof window.GITHUB_CONFIG === 'undefined') {
        console.error("Configurazione non trovata!");
        const loginPage = document.getElementById('loginPage');
        if (loginPage) {
            loginPage.innerHTML = `
                <div class="card w-full max-w-md mx-4">
                    <div class="logo-container p-6 text-center">
                        <h1 class="text-2xl font-bold text-white">CalcioDM3 Companion</h1>
                    </div>
                    <div class="p-8 text-center">
                        <i class="fa-solid fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                        <h2 class="text-xl font-semibold text-gray-800 mb-2">Errore di configurazione</h2>
                        <p class="text-gray-600">L'applicazione non è configurata correttamente.</p>
                        <p class="text-gray-600 mt-2">Controlla la console per maggiori dettagli.</p>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    // Inizializza l'app
    app = new CalcioDM3App();
    app.init();
    
    // Rendi l'app accessibile globalmente per debug
    window.app = app;
});

// Gestione errori non catturati
window.addEventListener('error', (event) => {
    console.error("Errore non catturato:", event.error);
});
