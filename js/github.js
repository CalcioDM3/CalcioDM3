// Gestione delle interazioni con GitHub API
class GitHubManager {
    constructor() {
        this.token = window.GITHUB_CONFIG.token;
        this.baseUrl = `https://api.github.com/repos/${window.GITHUB_CONFIG.user}/${window.GITHUB_CONFIG.repo}/contents`;
        this.players = [];
        this.ratings = {};
        this.imageCache = {};
    }

    async getHeaders() {
        const headers = {
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        };
        
        if (this.token) {
            headers["Authorization"] = `token ${this.token}`;
        }
        
        return headers;
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/${PLAYERS_FOLDER}`, {
                headers: await this.getHeaders()
            });
            return response.status === 200;
        } catch (error) {
            console.error("Errore di connessione a GitHub:", error);
            return false;
        }
    }

    async loadPlayers() {
        try {
            const response = await fetch(`${this.baseUrl}/${PLAYERS_FOLDER}`, {
                headers: await this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            
            const files = await response.json();
            this.players = [];
            
            for (const file of files) {
                if (file.name.endsWith('.json')) {
                    try {
                        const contentResponse = await fetch(file.download_url);
                        if (contentResponse.ok) {
                            const playerData = await contentResponse.json();
                            
                            // Cerca l'immagine associata
                            const baseName = file.name.replace('.json', '');
                            const imgFile = files.find(f => 
                                f.name.startsWith(baseName) && 
                                /\.(png|jpg|jpeg)$/i.test(f.name)
                            );
                            
                            if (imgFile) {
                                playerData.image_url = imgFile.download_url;
                            }
                            
                            playerData.id = this.players.length + 1;
                            this.players.push(playerData);
                        }
                    } catch (e) {
                        console.error(`Errore nel caricamento del giocatore ${file.name}:`, e);
                    }
                }
            }
            
            console.log(`Caricati ${this.players.length} giocatori`);
            return this.players;
        } catch (error) {
            console.error("Errore nel caricamento giocatori:", error);
            
            // Fallback a dati mock per sviluppo
            if (!this.token) {
                console.warn("Token non disponibile, uso dati mock");
                this.players = [
                    { id: 1, nome: "Mario", cognome: "Rossi", image_url: "https://via.placeholder.com/150" },
                    { id: 2, nome: "Luigi", cognome: "Bianchi", image_url: "https://via.placeholder.com/150" },
                    { id: 3, nome: "Giuseppe", cognome: "Verdi", image_url: "https://via.placeholder.com/150" }
                ];
                return this.players;
            }
            
            return [];
        }
    }

    async getPlayerImage(player, size = [80, 80]) {
        if (!player.image_url) {
            return null;
        }
        
        const cacheKey = `${player.image_url}_${size[0]}_${size[1]}`;
        
        if (this.imageCache[cacheKey]) {
            return this.imageCache[cacheKey];
        }
        
        try {
            const response = await fetch(player.image_url);
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                this.imageCache[cacheKey] = url;
                return url;
            }
        } catch (error) {
            console.error("Errore nel caricamento immagine:", error);
        }
        
        return null;
    }

    async uploadRatings(ratingsData) {
        try {
            if (!this.token) {
                console.warn("Token non disponibile, simulazione upload valutazioni");
                return true; // Simula successo in sviluppo
            }
            
            const safeName = ratingsData.valutatore.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `Valutazioni_${safeName}.json`;
            const path = `${RATINGS_FOLDER}/${filename}`;
            
            // Controlla se il file esiste già
            let sha = null;
            try {
                const existingResponse = await fetch(`${this.baseUrl}/${path}`, {
                    headers: await this.getHeaders()
                });
                
                if (existingResponse.ok) {
                    const existingData = await existingResponse.json();
                    sha = existingData.sha;
                }
            } catch (e) {
                // Il file non esiste, procediamo senza SHA
            }
            
            // Prepara i dati per l'upload
            const content = JSON.stringify(ratingsData, null, 2);
            const contentBase64 = btoa(unescape(encodeURIComponent(content)));
            
            const payload = {
                message: `Aggiornamento valutazioni di ${ratingsData.valutatore}`,
                content: contentBase64,
                branch: "main"
            };
            
            if (sha) {
                payload.sha = sha;
            }
            
            const response = await fetch(`${this.baseUrl}/${path}`, {
                method: 'PUT',
                headers: await this.getHeaders(),
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log("Valutazioni caricate con successo");
                return true;
            } else {
                console.error("Errore nel caricamento valutazioni:", await response.text());
                return false;
            }
        } catch (error) {
            console.error("Errore nell'upload delle valutazioni:", error);
            return false;
        }
    }

    async downloadUserRatings(username) {
        try {
            if (!this.token) {
                console.warn("Token non disponibile, uso valutazioni mock");
                return this.getMockRatings();
            }
            
            const safeName = username.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `Valutazioni_${safeName}.json`;
            const path = `${RATINGS_FOLDER}/${filename}`;
            
            const response = await fetch(`${this.baseUrl}/${path}`, {
                headers: await this.getHeaders()
            });
            
            if (response.ok) {
                const fileData = await response.json();
                const content = JSON.parse(atob(fileData.content));
                return content;
            } else if (response.status === 404) {
                // Il file non esiste, restituisci oggetto vuoto
                return { valutatore: username, valutazioni: {}, timestamp: new Date().toISOString() };
            } else {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error("Errore nel download delle valutazioni:", error);
            return { valutatore: username, valutazioni: {}, timestamp: new Date().toISOString() };
        }
    }

    async downloadUserCredentials(nome, cognome) {
        try {
            if (!this.token) {
                console.warn("Token non disponibile, uso credenziali mock");
                return this.getMockUser(nome, cognome);
            }
            
            const filename = `${nome}_${cognome}.json`;
            const path = `${USERS_FOLDER}/${filename}`;
            
            const response = await fetch(`${this.baseUrl}/${path}`, {
                headers: await this.getHeaders()
            });
            
            if (response.ok) {
                const fileData = await response.json();
                const content = JSON.parse(atob(fileData.content));
                return content;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Errore nel download delle credenziali:", error);
            return null;
        }
    }

    getMockUser(nome, cognome) {
        // Dati mock per sviluppo senza token
        const mockUsers = {
            "Gianmarco_Saponaro": { nome: "Gianmarco", cognome: "Saponaro", PIN: "007" },
            "Marco_DAmato": { nome: "Marco", cognome: "D'Amato", PIN: "5678" },
            "Test_User": { nome: "Test", cognome: "User", PIN: "0000" }
        };
        
        const key = `${nome}_${cognome}`.replace(' ', '_');
        return mockUsers[key] || null;
    }

    getMockRatings() {
        // Valutazioni mock per sviluppo
        return {
            valutatore: "Mock User",
            timestamp: new Date().toISOString(),
            valutazioni: {}
        };
    }

    isAuthenticated() {
        return this.token !== '';
    }
}

// Istanza globale del GitHubManager
window.githubManager = new GitHubManager();
