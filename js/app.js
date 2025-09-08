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
