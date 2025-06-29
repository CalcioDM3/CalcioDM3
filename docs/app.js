// Configurazione
const CONFIG = {
    GITHUB_USER: "CalcioDM3",
    REPO: "CalcioDM3",
    PLAYERS_FOLDER: "GIOCATORI",
    RATINGS_FOLDER: "VALUTAZIONI",
    USERS_FOLDER: "UTENTI",
    TOKEN: "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",
    ADMIN_USERS: ["Gianmarco Saponaro", "Marco D'Amato"]
};

// Stato applicazione
let currentState = {
    user: null,
    players: [],
    ratings: {}
};

// Gestore API GitHub
class GitHubManager {
    static getHeaders() {
        return {
            "Authorization": `token ${CONFIG.TOKEN}`,
            "Accept": "application/vnd.github.v3+json"
        };
    }

    static async testConnection() {
        try {
            const url = `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.REPO}/contents/${CONFIG.PLAYERS_FOLDER}`;
            const response = await fetch(url, { headers: this.getHeaders() });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    static async downloadPlayers() {
        try {
            const url = `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.REPO}/contents/${CONFIG.PLAYERS_FOLDER}`;
            const response = await fetch(url, { headers: this.getHeaders() });
            
            if (!response.ok) return [];
            
            const files = await response.json();
            const players = [];
            
            for (const file of files) {
                if (file.name.endsWith('.json')) {
                    const fileResponse = await fetch(file.download_url);
                    const playerData = await fileResponse.json();
                    
                    // Trova immagine associata
                    const baseName = file.name.split('.')[0];
                    const imgFile = files.find(f => 
                        f.name.startsWith(baseName) && 
                        ['.png', '.jpg', '.jpeg'].some(ext => f.name.toLowerCase().endsWith(ext))
                    );
                    
                    if (imgFile) {
                        playerData.image_url = imgFile.download_url;
                    }
                    
                    players.push({ ...playerData, id: players.length + 1 });
                }
            }
            
            return players;
        } catch (error) {
            alert(`Errore caricamento giocatori: ${error.message}`);
            return [];
        }
    }

    static async downloadUserCredentials(nome, cognome) {
        try {
            const safeName = `${nome}_${cognome}`.replace(' ', '_');
            const url = `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.REPO}/contents/${CONFIG.USERS_FOLDER}/${safeName}.json`;
            const response = await fetch(url, { headers: this.getHeaders() });
            
            if (!response.ok) return null;
            
            const fileData = await response.json();
            const content = atob(fileData.content);
            return JSON.parse(content);
        } catch (error) {
            return null;
        }
    }

    static async uploadRatings(ratingsData) {
        try {
            const safeName = ratingsData.valutatore.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `Valutazioni_${safeName}.json`;
            const path = `${CONFIG.RATINGS_FOLDER}/${fileName}`;
            
            const content = JSON.stringify(ratingsData, null, 4);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            const url = `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.REPO}/contents/${path}`;
            
            // Controlla se il file esiste già
            let sha = null;
            try {
                const existingFile = await fetch(url, { headers: this.getHeaders() });
                if (existingFile.ok) {
                    const fileInfo = await existingFile.json();
                    sha = fileInfo.sha;
                }
            } catch {}
            
            const body = {
                message: `Aggiornamento valutazioni di ${ratingsData.valutatore}`,
                content: encodedContent,
                branch: "main"
            };
            
            if (sha) body.sha = sha;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(body)
            });
            
            return response.ok;
        } catch (error) {
            alert(`Errore upload valutazioni: ${error.message}`);
            return false;
        }
    }
}

// Gestore Interfaccia Utente
class UI {
    static showScreen(screenName, data) {
        const appContainer = document.getElementById('app-container');
        
        switch(screenName) {
            case 'login':
                appContainer.innerHTML = this.renderLoginScreen();
                break;
                
            case 'main-menu':
                appContainer.innerHTML = this.renderMainMenu();
                break;
                
            case 'rate-players':
                appContainer.innerHTML = this.renderRatePlayersScreen();
                break;
                
            case 'rate-player':
                appContainer.innerHTML = this.renderRatePlayerScreen(data);
                break;
                
            case 'new-player':
                appContainer.innerHTML = this.renderNewPlayerScreen();
                break;
                
            case 'delete-player':
                appContainer.innerHTML = this.renderDeletePlayerScreen();
                break;
                
            default:
                appContainer.innerHTML = '<h1>Schermata non trovata</h1>';
        }
    }

    static renderLoginScreen() {
        return `
        <div class="login-screen">
            <div class="header">
                <h1>CalcioDM3 - Companion</h1>
            </div>
            
            <div class="login-form">
                <input type="text" id="nome" placeholder="Nome" class="form-input">
                <input type="text" id="cognome" placeholder="Cognome" class="form-input">
                <input type="password" id="pin" placeholder="PIN" class="form-input">
                <button onclick="App.login()" class="btn">Accedi</button>
            </div>
            
            <div class="logo-container">
                <img src="assets/logo.png" alt="Logo CalcioDM3" class="logo">
            </div>
        </div>`;
    }

    static renderMainMenu() {
        const fullName = `${currentState.user.nome} ${currentState.user.cognome}`;
        const isAdmin = CONFIG.ADMIN_USERS.includes(fullName);
        
        const adminSection = isAdmin ? `
            <button onclick="App.showScreen('new-player')" class="btn">Inserisci Giocatore</button>
            <button onclick="App.showScreen('delete-player')" class="btn">Elimina Giocatore</button>
        ` : '';
        
        return `
        <div class="main-menu">
            <div class="header">
                <h1>Benvenuto, ${currentState.user.nome}</h1>
            </div>
            
            <div class="menu-options">
                ${adminSection}
                <button onclick="App.showScreen('rate-players')" class="btn">Valuta Giocatori</button>
                <button onclick="App.uploadRatings()" class="btn">Condividi Valutazioni</button>
                <button onclick="App.refreshData()" class="btn">Aggiorna Dati</button>
                <button onclick="App.logout()" class="btn">Esci</button>
            </div>
        </div>`;
    }

    static renderRatePlayersScreen() {
        const playersHTML = currentState.players.map(player => `
            <div class="player-card" onclick="App.ratePlayer(${player.id})">
                <img src="${player.image_url || 'assets/placeholder.jpg'}" alt="${player.nome}" class="player-thumb">
                <div class="player-name">${player.nome} ${player.cognome}</div>
            </div>
        `).join('');
        
        return `
        <div class="rate-players-screen">
            <div class="header">
                <h1>Valuta Giocatori</h1>
                <p>Clicca su un giocatore per valutarlo</p>
            </div>
            
            <div class="player-grid">
                ${playersHTML}
            </div>
            
            <div class="actions">
                <button onclick="App.showScreen('main-menu')" class="btn">Indietro</button>
            </div>
        </div>`;
    }

    static renderRatePlayerScreen(playerId) {
        const player = currentState.players.find(p => p.id === playerId);
        if (!player) return '<h1>Giocatore non trovato</h1>';
        
        const playerFullName = `${player.nome} ${player.cognome}`;
        const playerRatings = currentState.ratings[playerFullName] || {};
        
        const skills = ["Tiro", "Velocità", "Tecnica", "Difesa", "Fisico", "Visione"];
        const slidersHTML = skills.map(skill => {
            const value = playerRatings[skill] || 50;
            return `
            <div class="skill-row">
                <label>${skill}</label>
                <input type="range" min="0" max="100" value="${value}" class="skill-slider" id="slider-${skill}" 
                       oninput="document.getElementById('value-${skill}').textContent = this.value">
                <span id="value-${skill}">${value}</span>
            </div>`;
        }).join('');
        
        return `
        <div class="rate-player-screen">
            <div class="header">
                <h1>Valuta ${player.nome}</h1>
            </div>
            
            <div class="skills-container">
                ${slidersHTML}
            </div>
            
            <div class="actions">
                <button onclick="App.saveRating(${playerId})" class="btn">Salva Valutazione</button>
                <button onclick="App.showScreen('rate-players')" class="btn">Annulla</button>
            </div>
        </div>`;
    }

    static showAlert(title, message) {
        alert(`${title}\n\n${message}`);
    }
}

// Controller applicazione
const App = {
    async init() {
        const loadingScreen = document.getElementById('loading-screen');
        try {
            const connected = await GitHubManager.testConnection();
            if (!connected) {
                UI.showAlert("Errore", "Connessione a GitHub fallita!");
                return;
            }
            
            loadingScreen.style.display = 'none';
            UI.showScreen('login');
        } catch (error) {
            loadingScreen.innerHTML = `
                <div class="error-screen">
                    <h2>Errore di connessione</h2>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">Ricarica</button>
                </div>
            `;
        }
    },

    async login() {
        const nome = document.getElementById('nome').value.trim();
        const cognome = document.getElementById('cognome').value.trim();
        const pin = document.getElementById('pin').value.trim();
        
        if (!nome || !cognome || !pin) {
            UI.showAlert("Errore", "Inserisci nome, cognome e PIN");
            return;
        }
        
        const credentials = await GitHubManager.downloadUserCredentials(nome, cognome);
        
        if (!credentials) {
            UI.showAlert("Errore", "Utente non trovato");
            return;
        }
        
        if (credentials.PIN !== pin) {
            UI.showAlert("Errore", "PIN errato");
            return;
        }
        
        currentState.user = { nome, cognome };
        await this.loadPlayers();
        UI.showScreen('main-menu');
    },
    
    async loadPlayers() {
        currentState.players = await GitHubManager.downloadPlayers();
    },
    
    showScreen(screenName, data) {
        UI.showScreen(screenName, data);
    },
    
    ratePlayer(playerId) {
        UI.showScreen('rate-player', playerId);
    },
    
    saveRating(playerId) {
        const player = currentState.players.find(p => p.id === playerId);
        if (!player) return;
        
        const playerFullName = `${player.nome} ${player.cognome}`;
        const skills = ["Tiro", "Velocità", "Tecnica", "Difesa", "Fisico", "Visione"];
        
        if (!currentState.ratings[playerFullName]) {
            currentState.ratings[playerFullName] = {};
        }
        
        skills.forEach(skill => {
            const slider = document.getElementById(`slider-${skill}`);
            currentState.ratings[playerFullName][skill] = parseInt(slider.value);
        });
        
        UI.showAlert("Successo", "Valutazione salvata!");
        this.showScreen('rate-players');
    },
    
    async uploadRatings() {
        if (Object.keys(currentState.ratings).length === 0) {
            UI.showAlert("Nessuna valutazione", "Non hai ancora valutato nessun giocatore");
            return;
        }
        
        const valutatore = `${currentState.user.nome} ${currentState.user.cognome}`;
        const ratingsData = {
            valutatore,
            timestamp: new Date().toISOString(),
            valutazioni: currentState.ratings
        };
        
        const success = await GitHubManager.uploadRatings(ratingsData);
        
        if (success) {
            UI.showAlert("Successo", "Valutazioni caricate con successo su GitHub!");
        } else {
            UI.showAlert("Errore", "Impossibile caricare le valutazioni");
        }
    },
    
    async refreshData() {
        await this.loadPlayers();
        UI.showAlert("Dati aggiornati", `Caricati ${currentState.players.length} giocatori`);
    },
    
    logout() {
        currentState = {
            user: null,
            players: [],
            ratings: {}
        };
        UI.showScreen('login');
    }
};

// Inizializzazione app
window.addEventListener('DOMContentLoaded', () => App.init());
