// Gestisce il caricamento efficiente di Pyodide
window.loadPyodide = async function(config) {
    if (!window.pyodide) {
        // Carica lo script Pyodide se non è già presente
        if (!window._pyodideLoading) {
            window._pyodideLoading = true;
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = config.indexURL || 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
                script.onload = () => resolve(window.loadPyodide(config));
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        return new Promise(resolve => {
            const check = () => {
                if (window.pyodide) resolve(window.pyodide);
                else setTimeout(check, 100);
            };
            check();
        });
    }
    
    // Inizializza Pyodide
    return window.pyodide;
};
