// Gestione dei giocatori

class PlayersManager {
    constructor() {
        this.players = [];
    }

    async loadPlayers() {
        this.players = await githubManager.loadPlayers();
        return this.players;
    }

    getPlayers() {
        return this.players;
    }

    getPlayerById(id) {
        return this.players.find(player => player.id === id);
    }

    searchPlayers(query) {
        if (!query) return this.players;
        
        const lowerQuery = query.toLowerCase();
        return this.players.filter(player => 
            player.nome.toLowerCase().includes(lowerQuery) || 
            player.cognome.toLowerCase().includes(lowerQuery)
        );
    }

    async addPlayer(nome, cognome, imageFile) {
        try {
            if (!githubManager.isAuthenticated()) {
                console.warn("Token non disponibile, simulazione aggiunta giocatore");
                
                // Aggiungi giocatore mock
                const newPlayer = {
                    id: this.players.length + 1,
                    nome: nome,
                    cognome: cognome,
                    image_url: imageFile ? URL.createObjectURL(imageFile) : "https://via.placeholder.com/150"
                };
                
                this.players.push(newPlayer);
                return { success: true, player: newPlayer };
            }
            
            // Qui implementeremo l'upload del giocatore su GitHub
            // Per ora simuliamo il successo
            const newPlayer = {
                id: this.players.length + 1,
                nome: nome,
                cognome: cognome,
                image_url: imageFile ? URL.createObjectURL(imageFile) : "https://via.placeholder.com/150"
            };
            
            this.players.push(newPlayer);
            return { success: true, player: newPlayer };
            
        } catch (error) {
            console.error("Errore nell'aggiunta del giocatore:", error);
            return { success: false, error: "Impossibile aggiungere il giocatore" };
        }
    }

    async deletePlayer(playerId) {
        try {
            if (!githubManager.isAuthenticated()) {
                console.warn("Token non disponibile, simulazione eliminazione giocatore");
                
                // Rimuovi giocatore mock
                this.players = this.players.filter(player => player.id !== playerId);
                return { success: true };
            }
            
            // Qui implementeremo l'eliminazione del giocatore da GitHub
            // Per ora simuliamo il successo
            this.players = this.players.filter(player => player.id !== playerId);
            return { success: true };
            
        } catch (error) {
            console.error("Errore nell'eliminazione del giocatore:", error);
            return { success: false, error: "Impossibile eliminare il giocatore" };
        }
    }
}

// Istanza globale del PlayersManager
const playersManager = new PlayersManager();
