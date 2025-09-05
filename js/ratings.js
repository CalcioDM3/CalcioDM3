// Gestione delle valutazioni

class RatingsManager {
    constructor() {
        this.userRatings = this.loadLocalRatings();
    }

    loadLocalRatings() {
        const saved = localStorage.getItem('userRatings');
        return saved ? JSON.parse(saved) : {};
    }

    saveLocalRatings() {
        localStorage.setItem('userRatings', JSON.stringify(this.userRatings));
    }

    getPlayerRating(playerId) {
        return this.userRatings[playerId] || null;
    }

    ratePlayer(playerId, skills) {
        this.userRatings[playerId] = {
            ...skills,
            timestamp: new Date().toISOString()
        };
        
        this.saveLocalRatings();
    }

    getAllRatings() {
        return this.userRatings;
    }

    getRatingsCount() {
        return Object.keys(this.userRatings).length;
    }

    async shareRatings() {
        try {
            const user = authManager.getCurrentUser();
            if (!user) {
                return { success: false, error: "Utente non autenticato" };
            }
            
            const valutatore = `${user.nome} ${user.cognome}`;
            
            // Prepara i dati per l'upload
            const ratingsData = {
                valutatore: valutatore,
                timestamp: new Date().toISOString(),
                valutazioni: this.userRatings
            };
            
            // Upload su GitHub
            const success = await githubManager.uploadRatings(ratingsData);
            
            if (success) {
                return { success: true, message: "Valutazioni condivise con successo!" };
            } else {
                return { success: false, error: "Errore nel caricamento delle valutazioni" };
            }
        } catch (error) {
            console.error("Errore nella condivisione delle valutazioni:", error);
            return { success: false, error: "Errore di connessione" };
        }
    }

    async loadSharedRatings() {
        try {
            const user = authManager.getCurrentUser();
            if (!user) {
                return { success: false, error: "Utente non autenticato" };
            }
            
            const username = `${user.nome} ${user.cognome}`;
            const sharedRatings = await githubManager.downloadUserRatings(username);
            
            if (sharedRatings && sharedRatings.valutazioni) {
                // Unisci le valutazioni condivise con quelle locali
                this.userRatings = { ...sharedRatings.valutazioni, ...this.userRatings };
                this.saveLocalRatings();
            }
            
            return { success: true, ratings: sharedRatings };
        } catch (error) {
            console.error("Errore nel caricamento delle valutazioni condivise:", error);
            return { success: false, error: "Errore di connessione" };
        }
    }
}

// Istanza globale del RatingsManager
const ratingsManager = new RatingsManager();
