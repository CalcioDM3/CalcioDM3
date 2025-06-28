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
    },
    
    previewImage: function(event) {
        const input = event.target;
        const preview = document.getElementById('player-image-preview');
        
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
            };
            reader.readAsDataURL(input.files[0]);
        }
    },
    
    savePlayer: async function() {
        const nome = document.getElementById('player-nome').value;
        const cognome = document.getElementById('player-cognome').value;
        const imageInput = document.getElementById('player-image-input');
        let imageData = null;
        
        if (imageInput.files.length > 0) {
            const file = imageInput.files[0];
            imageData = await this.readFileAsBase64(file);
        }
        
        try {
            const result = await pyodide.runPythonAsync(`
                app.handle_web_event('save_player', {
                    'nome': "${nome}",
                    'cognome': "${cognome}",
                    'image': ${imageData ? `"${imageData}"` : 'None'}
                })
            `);
            
            if (result.status === "success") {
                alert(result.message);
                app.showScreen('main-menu');
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Errore durante il salvataggio:", error);
        }
    },
    
    readFileAsBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },
    
    confirmDeletePlayer: async function(player_id) {
        if (!confirm("Sei sicuro di voler eliminare questo giocatore?")) {
            return;
        }
        
        try {
            const result = await pyodide.runPythonAsync(`
                app.handle_web_event('confirm_delete_player', { 'player_id': ${player_id} })
            `);
            
            alert(result.message);
            if (result.status === "success") {
                app.showScreen('delete-player');
            }
        } catch (error) {
            console.error("Errore durante l'eliminazione:", error);
        }
    },
    
    ratePlayer: async function(player_id) {
        try {
            const result = await pyodide.runPythonAsync(`
                app.handle_web_event('rate_player', { 'player_id': ${player_id} })
            `);
            
            if (result.status === "error") {
                alert(result.message);
            }
        } catch (error) {
            console.error("Errore:", error);
        }
    },
    
    saveRating: async function(player_id) {
        const ratings = {};
        const skills = ["Tiro", "Velocità", "Tecnica", "Difesa", "Fisico", "Visione"];
        
        skills.forEach(skill => {
            const slider = document.getElementById(`slider-${skill}`);
            if (slider) {
                ratings[skill] = parseInt(slider.value);
            }
        });
        
        try {
            const result = await pyodide.runPythonAsync(`
                app.handle_web_event('save_rating', {
                    'player_id': ${player_id},
                    'ratings': ${JSON.stringify(ratings)}
                })
            `);
            
            alert(result.message);
            if (result.status === "success") {
                app.showScreen('rate-players');
            }
        } catch (error) {
            console.error("Errore durante il salvataggio:", error);
        }
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

// Avvia Pyodide solo se tutto è pronto
window.addEventListener('DOMContentLoaded', () => {
    if (window.loadPyodide) {
        initPyodide();
    } else {
        console.error("loadPyodide non è definito!");
    }
});
