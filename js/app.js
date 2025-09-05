// Applicazione principale

class CalcioDM3App {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPlayerForRating = null;
    }

    async init() {
        // Verifica la connessione a GitHub
        const isConnected = await githubManager.testConnection();
        
        if (!isConnected && githubManager.isAuthenticated()) {
            console.warn("Impossibile connettersi a GitHub");
            this.showNotification("Errore di connessione a GitHub. Usando dati locali.", "error");
        }
        
        // Controlla se l'utente è già loggato
        const userData = authManager.getCurrentUser();
        
        if (userData) {
            this.showApp();
            this.loadDashboard();
        } else {
            this.showLogin();
        }
        
        // Imposta i gestori eventi
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Aggiungi giocatore form
        document.getElementById('addPlayerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddPlayer();
        });
        
        // Cerca giocatori
        document.getElementById('playerSearch')?.addEventListener('input', (e) => {
            this.filterPlayers(e.target.value);
        });
        
        // Menu mobile
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            document.getElementById('mobileMenu').classList.remove('hidden');
        });
        
        document.getElementById('closeMobileMenu')?.addEventListener('click', () => {
            document.getElementById('mobileMenu').classList.add('hidden');
        });
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
            const result = await authManager.login(nome, cognome, pin);
            
            if (result.success) {
                this.showApp();
                this.loadDashboard();
            } else {
                this.showNotification(result.error, "error");
            }
        } catch (error) {
            this.showNotification("Errore durante l'accesso", "error");
        } finally {
            loginButton.innerHTML = originalText;
            loginButton.disabled = false;
        }
    }

    showLogin() {
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
    }

    showApp() {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        
        // Carica il contenuto della dashboard
        this.loadDashboardContent();
    }

    async loadDashboard() {
        // Carica i giocatori
        await playersManager.loadPlayers();
        
        // Carica le valutazioni condivise
        await ratingsManager.loadSharedRatings();
        
        // Aggiorna la dashboard
        this.updateDashboard();
    }

    updateDashboard() {
        const players = playersManager.getPlayers();
        const ratingsCount = ratingsManager.getRatingsCount();
        
        // Aggiorna i contatori
        document.getElementById('playersCount').textContent = players.length;
        document.getElementById('ratingsCount').textContent = ratingsCount;
        
        // Mostra giocatori recenti
        this.showRecentPlayers(players.slice(0, 3));
        
        // Controlla se l'utente è admin
        const user = authManager.getCurrentUser();
        if (user && user.isAdmin) {
            document.getElementById('adminSection').style.display = 'block';
            document.getElementById('adminButton').style.display = 'block';
            document.getElementById('mobileAdminSection').style.display = 'block';
        }
        
        // Aggiorna il nome utente
        if (user) {
            document.getElementById('userName').textContent = user.nome;
            document.getElementById('mobileUserName').textContent = user.nome;
            document.getElementById('mobileMenuUserName').textContent = user.nome;
        }
    }

    showRecentPlayers(players) {
        const container = document.getElementById('recentPlayers');
        
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
        document.querySelectorAll('[id$="Section"]').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Mostra la sezione richiesta
        document.getElementById(sectionName + 'Section').classList.remove('hidden');
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
        document.getElementById('mobileMenu').classList.add('hidden');
    }

    async showPlayersList() {
        const container = document.getElementById('playersList');
        const players = playersManager.getPlayers();
        
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
    }

    async showRatingsList() {
        const container = document.getElementById('ratingsList');
        const players = playersManager.getPlayers();
        
        if (players.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-3 text-center py-8">Nessun giocatore disponibile</p>';
            return;
        }
        
        container.innerHTML = players.map(player => {
            const rating = ratingsManager.getPlayerRating(player.id);
            
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
    }

    ratePlayer(playerId) {
        const player = playersManager.getPlayerById(playerId);
        if (!player) return;
        
        this.currentPlayerForRating = player;
        
        // Mostra il modal di valutazione
        document.getElementById('ratingPlayerName').textContent = `Valuta ${player.nome} ${player.cognome}`;
        
        // Resetta le skill
        const skillsContainer = document.getElementById('ratingSkills');
        skillsContainer.innerHTML = '';
        
        // Aggiungi le skill
        const skills = ['Tiro', 'Velocità', 'Tecnica', 'Difesa', 'Fisico', 'Visione'];
        const currentRating = ratingsManager.getPlayerRating(playerId);
        
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
            
            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
            });
        });
        
        // Mostra il modal
        document.getElementById('ratingModal').classList.remove('hidden');
    }

    closeRatingModal() {
        document.getElementById('ratingModal').classList.add('hidden');
        this.currentPlayerForRating = null;
    }

    savePlayerRating() {
        if (!this.currentPlayerForRating) return;
        
        const skills = ['Tiro', 'Velocità', 'Tecnica', 'Difesa', 'Fisico', 'Visione'];
        const ratings = {};
        
        skills.forEach(skill => {
            const slider = document.getElementById(`skill-${skill}`);
            ratings[skill] = parseInt(slider.value);
        });
        
        // Salva la valutazione
        ratingsManager.ratePlayer(this.currentPlayerForRating.id, ratings);
        
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
        const result = await ratingsManager.shareRatings();
        
        if (result.success) {
            this.showNotification(result.message, "success");
        } else {
            this.showNotification(result.error, "error");
        }
    }

    async handleAddPlayer() {
        const nome = document.getElementById('newPlayerName').value.trim();
        const cognome = document.getElementById('newPlayerSurname').value.trim();
        const imageFile = document.getElementById('newPlayerImage').files[0];
        
        if (!nome || !cognome) {
            this.showNotification("Inserisci nome e cognome", "error");
            return;
        }
        
        const submitButton = document.querySelector('#addPlayerForm button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Aggiungendo...';
        submitButton.disabled = true;
        
        try {
            const result = await playersManager.addPlayer(nome, cognome, imageFile);
            
            if (result.success) {
                this.showNotification("Giocatore aggiunto con successo!", "success");
                document.getElementById('addPlayerForm').reset();
                
                // Aggiorna le liste
                this.showPlayersList();
                this.showRatingsList();
                this.updateDashboard();
            } else {
                this.showNotification(result.error, "error");
            }
        } catch (error) {
            this.showNotification("Errore nell'aggiunta del giocatore", "error");
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    showAdminPanel() {
        const container = document.getElementById('adminPlayersList');
        const players = playersManager.getPlayers();
        
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
    }

    async deletePlayer(playerId) {
        if (!confirm("Sei sicuro di voler eliminare questo giocatore?")) {
            return;
        }
        
        const result = await playersManager.deletePlayer(playerId);
        
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
    }

    filterPlayers(query) {
        const filteredPlayers = playersManager.searchPlayers(query);
        const container = document.getElementById('playersList');
        
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
    }

    async refreshData() {
        await this.loadDashboard();
        this.showNotification("Dati aggiornati con successo!", "success");
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
            notification.remove();
        }, 3000);
    }

    loadDashboardContent() {
        // Questo metodo caricherà il contenuto della dashboard dal file esterno
        // Per ora è vuoto, il contenuto è già nel file HTML
    }
}

// Funzioni globali per l'accesso da HTML
function showSection(sectionName) {
    app.showSection(sectionName);
}

function logout() {
    authManager.logout();
    app.showLogin();
}

function shareRatings() {
    app.shareRatings();
}

function refreshData() {
    app.refreshData();
}

function closeRatingModal() {
    app.closeRatingModal();
}

function savePlayerRating() {
    app.savePlayerRating();
}

// Inizializza l'app quando il DOM è pronto
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CalcioDM3App();
    app.init();
});
