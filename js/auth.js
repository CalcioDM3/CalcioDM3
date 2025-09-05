// Gestione dell'autenticazione

class AuthManager {
    constructor() {
        this.adminUsers = ADMIN_USERS;
        this.currentUser = null;
    }

    async login(nome, cognome, pin) {
        try {
            // Verifica le credenziali
            const credentials = await githubManager.downloadUserCredentials(nome, cognome);
            
            if (!credentials) {
                return { success: false, error: "Utente non trovato" };
            }
            
            if (credentials.PIN !== pin) {
                return { success: false, error: "PIN errato" };
            }
            
            // Crea l'oggetto utente
            this.currentUser = {
                nome: nome,
                cognome: cognome,
                isAdmin: this.isAdmin(nome, cognome)
            };
            
            // Salva nel localStorage
            localStorage.setItem('userData', JSON.stringify(this.currentUser));
            
            return { success: true, data: this.currentUser };
        } catch (error) {
            console.error("Errore durante il login:", error);
            return { success: false, error: "Errore di connessione" };
        }
    }

    isAdmin(nome, cognome) {
        const fullName = `${nome} ${cognome}`;
        return this.adminUsers.includes(fullName);
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('userData');
        localStorage.removeItem('userRatings');
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const savedData = localStorage.getItem('userData');
            if (savedData) {
                this.currentUser = JSON.parse(savedData);
            }
        }
        return this.currentUser;
    }

    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }
}

// Istanza globale dell'AuthManager
const authManager = new AuthManager();
