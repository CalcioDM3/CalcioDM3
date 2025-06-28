// Gestione eventi UI
window.app = {
    // ... [mantieni tutto il resto del codice come prima] ...
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
        
        // Carica micropip per gestire i pacchetti
        await pyodide.loadPackage('micropip');
        const micropip = pyodide.pyimport('micropip');
        
        // Installa pyodide-http
        await micropip.install('pyodide-http');
        
        // Imposta il flag per indicare che siamo in web mode
        pyodide.runPython(`import sys; sys.running_in_web = True`);
        
        // Carica il codice Python dalla repository
        const response = await fetch('https://raw.githubusercontent.com/CalcioDM3/CalcioDM3/main/main.py');
        const pythonCode = await response.text();
        
        // Esegui il codice Python
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

// Avvia Pyodide solo se tutto è pronto
window.addEventListener('DOMContentLoaded', () => {
    if (window.loadPyodide) {
        initPyodide();
    } else {
        console.error("loadPyodide non è definito!");
    }
});
