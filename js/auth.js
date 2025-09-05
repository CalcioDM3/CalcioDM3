// js/auth.js

class AuthManager {
    constructor() {
        this.adminUsers = ["Gianmarco Saponaro", "Marco D'Amato"];
        this.users = [];
    }

    async init() {
        await this.loadUsers();
    }

    async loadUsers() {
        try {
            // Qui implementeremo il caricamento degli utenti da GitHub
            // Per ora usiamo dati mock
            this.users = [
                { nome: "Gianmarco", cognome: "Saponaro", PIN: "1234" },
                { nome: "Marco", cognome: "D'Amato", PIN: "5678" },
                { nome: "Test", cognome: "User", PIN: "0000" }
            ];
        } catch (error) {
            console.error("Errore nel caricamento utenti:", error);
        }
    }

    login(nome, cognome, pin) {
        const user = this.users.find(u => 
            u.nome.toLowerCase() === nome.toLowerCase() && 
            u.cognome.toLowerCase() === cognome.toLowerCase() &&
            u.PIN === pin
        );

        if (user) {
            const userData = {
                nome: user.nome,
                cognome: user.cognome,
                isAdmin: this.isAdmin(user.nome, user.cognome)
            };
            
            localStorage.setItem('userData', JSON.stringify(userData));
            return { success: true, data: userData };
        } else {
            return { success: false, error: "Credenziali non valide" };
        }
    }

    isAdmin(nome, cognome) {
        const fullName = `${nome} ${cognome}`;
        return this.adminUsers.includes(fullName);
    }

    logout() {
        localStorage.removeItem('userData');
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('userData'));
    }

    isAuthenticated() {
        return localStorage.getItem('userData') !== null;
    }
}

// Istanza globale dell'AuthManager
const authManager = new AuthManager();
