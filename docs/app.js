// Gestione eventi UI
window.app = {
    login: async function() {
        const nome = document.getElementById('nome').value;
        const cognome = document.getElementById('cognome').value;
        const pin = document.getElementById('pin').value;
        
        const result = await pyodide.runPythonAsync(`
            app.login("${nome}", "${cognome}", "${pin}")
        `);
        
        if (result) {
            app.showScreen('main-menu');
        }
    },
    
    showScreen: function(screenName) {
        pyodide.runPythonAsync(`app.create_${screenName}_screen_web()`);
    },
    
    refreshData: function() {
        pyodide.runPythonAsync(`app.refresh_data()`);
    },
    
    // ... altri metodi
};

// Inizializzazione Pyodide
async function initPyodide() {
    try {
        const pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
        });
        
        // Carica dipendenze
        await pyodide.loadPackage(['micropip']);
        await pyodide.runPythonAsync(`
            import micropip
            await micropip.install(['pyodide-http'])
        `);
        
        // Carica il codice principale
        const response = await fetch('https://raw.githubusercontent.com/CalcioDM3/CalcioDM3/main/main.py');
        const pythonCode = await response.text();
        await pyodide.runPythonAsync(pythonCode);
        
        // Avvia l'app
        await pyodide.runPythonAsync(`
            import sys
            sys.running_in_web = True
            from main import FootballApp
            app = FootballApp()
            app.run_web()
        `);
        
        document.getElementById('loading-screen').style.display = 'none';
    } catch (error) {
        console.error('Errore di inizializzazione:', error);
        document.getElementById('loading-screen').innerHTML = `
            <div class="error-screen">
                <h2>Errore di caricamento</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">Ricarica</button>
            </div>
        `;
    }
}

initPyodide();
