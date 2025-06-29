// Gestione eventi UI
window.app = {
    login: function() {
        const nome = document.getElementById('nome').value;
        const cognome = document.getElementById('cognome').value;
        const pin = document.getElementById('pin').value;
        
        window.pyd_app.login(nome, cognome, pin).then(result => {
            if (!result) {
                alert("Accesso fallito!");
            }
        });
    },
    showScreen: function(screenName) {
        if (screenName === 'new-player') {
            window.pyd_app.create_new_player_screen_web();
        } else if (screenName === 'delete-player') {
            window.pyd_app.create_delete_player_screen_web();
        } else if (screenName === 'rate-players') {
            window.pyd_app.create_rate_players_screen_web();
        } else if (screenName === 'main-menu') {
            window.pyd_app.create_main_menu_web();
        }
    },
    previewImage: function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('player-image-preview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    },
    savePlayer: async function() {
        const nome = document.getElementById('player-nome').value;
        const cognome = document.getElementById('player-cognome').value;
        const imageInput = document.getElementById('player-image-input');
        const imageFile = imageInput.files[0];
        
        let imageData = null;
        if (imageFile) {
            imageData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result.split(',')[1]);
                reader.readAsDataURL(imageFile);
            });
        }
        
        const result = await window.pyd_app.handle_web_event('save_player', {
            nome: nome,
            cognome: cognome,
            image: imageData
        });
        
        alert(result.message);
        if (result.status === 'success') {
            this.showScreen('main-menu');
        }
    },
    confirmDeletePlayer: function(playerId) {
        if (confirm("Sei sicuro di voler eliminare questo giocatore?")) {
            window.pyd_app.handle_web_event('confirm_delete_player', {player_id: playerId})
                .then(result => {
                    alert(result.message);
                    if (result.status === 'success') {
                        this.showScreen('delete-player');
                    }
                });
        }
    },
    ratePlayer: function(playerId) {
        window.pyd_app.handle_web_event('rate_player', {player_id: playerId});
    },
    saveRating: async function(playerId) {
        const ratings = {};
        const skills = ["Tiro", "Velocità", "Tecnica", "Difesa", "Fisico", "Visione"];
        
        for (const skill of skills) {
            const slider = document.getElementById(`slider-${skill}`);
            ratings[skill] = parseInt(slider.value);
        }
        
        const result = await window.pyd_app.handle_web_event('save_rating', {
            player_id: playerId,
            ratings: ratings
        });
        
        alert(result.message);
        if (result.status === 'success') {
            this.showScreen('rate-players');
        }
    },
    prepare_share_ratings: function() {
        window.pyd_app.prepare_share_ratings();
    },
    refresh_data: function() {
        window.pyd_app.refresh_data();
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
        
        // Carica micropip per gestire i pacchetti
        await pyodide.loadPackage('micropip');
        const micropip = pyodide.pyimport('micropip');
        
        // Installa pyodide-http
        await micropip.install('pyodide-http');
        
        // Imposta il flag per indicare che siamo in web mode
        pyodide.runPython(`import sys; sys.running_in_web = True`);
        
        // Carica il codice Python dalla repository
        const response = await fetch('https://raw.githubusercontent.com/CalcioDM3/CalcioDM3/main/main.py?cache=' + Date.now());
        if (!response.ok) {
            throw new Error(`Failed to fetch main.py: ${response.status}`);
        }
        let pythonCode = await response.text();
        
        // Rimuovi eventuali tag HTML che potrebbero essersi inseriti
        pythonCode = pythonCode.replace(/<style[\s\S]*?<\/style>/g, '');
        pythonCode = pythonCode.replace(/<script[\s\S]*?<\/script>/g, '');
        pythonCode = pythonCode.replace(/<[^>]+>/g, '');
        
        // Esegui il codice Python
        await pyodide.runPythonAsync(pythonCode);
        
        // Avvia l'app
        await pyodide.runPythonAsync(`
            from main import FootballApp
            app = FootballApp()
            app.run_web()
            from js import globalThis
            globalThis.pyd_app = app
        `);
        
        // Nascondi lo spinner
        loadingScreen.style.display = 'none';
    } catch (error) {
        console.error('Errore di inizializzazione:', error);
        loadingScreen.innerHTML = `
            <div class="error-screen">
                <h2>Errore di caricamento</h2>
                <p>${error.message}</p>
                <p>Controlla la console per maggiori dettagli</p>
                <button onclick="location.reload()">Ricarica</button>
            </div>
        `;
    }
}

// Gestisce il caricamento efficiente di Pyodide
window.loadPyodide = async function(config) {
    if (window.pyodide) {
        return window.pyodide;
    }
    
    // Carica lo script Pyodide
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = config.indexURL || 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
        script.onload = async () => {
            try {
                const pyodide = await loadPyodide(config);
                window.pyodide = pyodide;
                resolve(pyodide);
            } catch (err) {
                reject(err);
            }
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// Avvia Pyodide
window.addEventListener('DOMContentLoaded', () => {
    initPyodide();
});
