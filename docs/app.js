// Gestione della UI e integrazione con Pyodide
document.addEventListener('DOMContentLoaded', async () => {
    // Mostra lo spinner durante il caricamento
    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.getElementById('app-container');
    
    try {
        // Carica Pyodide
        const pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
        });
        
        // Carica le dipendenze Python necessarie
        await pyodide.loadPackage(['micropip']);
        await pyodide.runPythonAsync(`
            import micropip
            await micropip.install(['requests', 'Pillow'])
        `);
        
        // Carica il codice Python dalla repository
        const response = await fetch('https://raw.githubusercontent.com/CalcioDM3/CalcioDM3/main/main.py');
        const pythonCode = await response.text();
        
        // Esegui il codice Python
        await pyodide.runPythonAsync(pythonCode);
        
        // Avvia l'applicazione
        await pyodide.runPythonAsync(`
            from main import FootballApp
            app = FootballApp()
            app.run_web()
        `);
        
        // Nascondi lo spinner
        loadingScreen.style.display = 'none';
    } catch (error) {
        console.error('Errore durante il caricamento:', error);
        loadingScreen.innerHTML = `
            <h2>Errore di caricamento</h2>
            <p>${error.message}</p>
            <button onclick="location.reload()">Ricarica</button>
        `;
    }
});

// Funzione globale per la comunicazione tra Python e JS
window.updateUI = (htmlContent) => {
    appContainer.innerHTML = htmlContent;
};
