// Gestisce il caricamento efficiente di Pyodide
async function loadPyodide(config) {
    if (!window.pyodide) {
        // Carica lo script Pyodide
        const script = document.createElement('script');
        script.src = `${config.indexURL || 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/'}pyodide.js`;
        document.head.appendChild(script);
        
        // Attendi il caricamento
        await new Promise((resolve) => {
            script.onload = resolve;
        });
    }
    
    // Inizializza Pyodide
    return await loadPyodide({
        indexURL: config.indexURL,
        stdout: (text) => console.log(text),
        stderr: (text) => console.error(text)
    });
}
