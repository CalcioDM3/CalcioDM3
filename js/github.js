// js/github.js (versione aggiornata)

class GitHubManager {
    constructor() {
        this.token = null; // Non hardcodiamo più il token
        this.baseUrl = 'https://api.github.com/repos/CalcioDM3/CalcioDM3/contents';
        this.players = [];
    }

    async init() {
        // Prova a ottenere il token da un endpoint sicuro
        this.token = await this.getTokenSecurely();
    }

    async getTokenSecurely() {
        // In sviluppo, possiamo usare un token locale da un file non versionato
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            try {
                const response = await fetch('/token.json');
                const data = await response.json();
                return data.token;
            } catch (e) {
                console.warn('Token non disponibile in locale. Assicurati di avere un file token.json con il tuo token.');
                return null;
            }
        }
        
        // In produzione, usa un serverless function o proxy
        try {
            const response = await fetch('/.netlify/functions/get-token');
            const data = await response.json();
            return data.token;
        } catch (e) {
            console.error('Impossibile ottenere il token:', e);
            return null;
        }
    }

    async getHeaders() {
        return {
            "Authorization": `token ${this.token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        };
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/GIOCATORI`, {
                headers: await this.getHeaders()
            });
            return response.status === 200;
        } catch (error) {
            console.error("Errore di connessione:", error);
            return false;
        }
    }

    async loadPlayers() {
        try {
            const response = await fetch(`${this.baseUrl}/GIOCATORI`, {
                headers: await this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            
            const files = await response.json();
            this.players = [];
            
            for (const file of files) {
                if (file.name.endsWith('.json')) {
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
                        
                        this.players.push(playerData);
                    }
                }
            }
            
            return this.players;
        } catch (error) {
            console.error("Errore nel caricamento giocatori:", error);
            return [];
        }
    }

    async uploadRatings(ratingsData) {
        try {
            const username = ratingsData.valutatore;
            const safeName = username.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `Valutazioni_${safeName}.json`;
            const path = `VALUTAZIONI/${filename}`;
            
            const content = JSON.stringify(ratingsData, null, 2);
            const contentBase64 = btoa(unescape(encodeURIComponent(content)));
            
            // Controlla se il file esiste già per ottenere lo SHA
            let sha = null;
            try {
                const existingFileResponse = await fetch(`${this.baseUrl}/${path}`, {
                    headers: await this.getHeaders()
                });
                
                if (existingFileResponse.ok) {
                    const existingFile = await existingFileResponse.json();
                    sha = existingFile.sha;
                }
            } catch (e) {
                // Il file non esiste, procediamo senza SHA
            }
            
            const payload = {
                message: `Aggiornamento valutazioni di ${username}`,
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
            
            return response.ok;
        } catch (error) {
            console.error("Errore nel caricamento valutazioni:", error);
            return false;
        }
    }
}

// Istanza globale del GitHubManager
const githubManager = new GitHubManager();
