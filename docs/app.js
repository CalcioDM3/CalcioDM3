// Gestione eventi UI
window.app = {
    login: async function() {
        const nome = document.getElementById('nome').value;
        const cognome = document.getElementById('cognome').value;
        const pin = document.getElementById('pin').value;
        
        try {
            const result = await pyodide.runPythonAsync(`
                app.login("${nome}", "${cognome}", "${pin}")
            `);
            if (result) {
                // Login riuscito
            }
        } catch (error) {
            console.error("Errore durante il login:", error);
        }
    },
    
    showScreen: function(screenName) {
        pyodide.runPythonAsync(`app.create_${screenName}_screen_web()`);
    },
    
    prepare_share_ratings: function() {
        pyodide.runPythonAsync(`app.prepare_share_ratings()`);
    },
    
    refresh_data: function() {
        pyodide.runPythonAsync(`app.refresh_data()`);
    },
    
    logout: function() {
        location.reload();
    }
};

// Funzione per aggiornare l'interfaccia
window.updateUI = function(htmlContent) {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = htmlContent;
};

// Inizializzazione Pyodide
async function initPyodide() {
    const loadingScreen = document.getElementById('loading-screen');
    
    try {
        // Carica Pyodide
        const pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
        });
        window.pyodide = pyodide;
        
        // Carica pacchetti Python
        await pyodide.loadPackage(['micropip']);
        await pyodide.runPythonAsync(`
            import micropip
            await micropip.install(['pyodide-http'])
        `);
        
        // Imposta il flag per indicare che siamo in web mode
        pyodide.runPython(`import sys; sys.running_in_web = True`);
        
        // Carica il codice Python dalla repository
        const response = await fetch('https://raw.githubusercontent.com/CalcioDM3/CalcioDM3/main/main.py');
        const pythonCode = await response.text();
        await pyodide.runPythonAsync(pythonCode);
        
        // Avvia l'app
        await pyodide.runPythonAsync(`
            from main import FootballApp
            app = FootballApp()
            app.run_web()
        `);
        
        // Nascondi lo spinner
        loadingScreen.style.display = 'none';
    } catch (error) {
        console.error('Errore di inizializzazione:', error);
        loadingScreen.innerHTML = `
            <div class="error-screen">
                <h2>Errore di caricamento</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">Ricarica</button>
            </div>
        `;
    }
}

initPyodide();
