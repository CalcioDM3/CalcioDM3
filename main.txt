import sys
import json
import threading
import time
import re
import base64
import os
import requests
from io import BytesIO

# Verifica se siamo in modalità web (Pyodide)
WEB_MODE = hasattr(sys, 'running_in_web')

# Import condizionali per moduli specifici desktop
if not WEB_MODE:
    import tkinter as tk
    from tkinter import ttk, filedialog, messagebox
    from PIL import Image, ImageTk
    import shutil

# Risolve il problema del percorso delle risorse in PyInstaller (solo desktop)
def resource_path(relative_path):
    if not WEB_MODE and hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

# Dimensioni finestra principale in pixel (solo desktop)
WINDOW_WIDTH = 380
WINDOW_HEIGHT = 680

# Colore sfondo principale
BG_COLOR = "#A5E090"

# Account admin
ADMIN_USERS = ["Gianmarco Saponaro", "Marco D'Amato"]

# Configurazione GitHub API
GITHUB_USER = "CalcioDM3"
GITHUB_REPO = "CalcioDM3"
PLAYERS_FOLDER = "GIOCATORI"
RATINGS_FOLDER = "VALUTAZIONI"
USERS_FOLDER = "UTENTI"

# Token GitHub preconfigurato
GITHUB_TOKEN = "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"

class GitHubManager:
    def __init__(self):
        self.token = GITHUB_TOKEN
        self.base_url = f"https://api.github.com/repos/{GITHUB_USER}/{GITHUB_REPO}/contents"
        self.image_cache = {}
    
    def is_authenticated(self):
        return self.token is not None and self.token != ""
    
    def get_headers(self):
        return {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json"
        }
    
    def test_connection(self):
        """Verifica la connessione a GitHub"""
        try:
            url = f"{self.base_url}/{PLAYERS_FOLDER}"
            if WEB_MODE:
                # Utilizza fetch se in web mode
                from js import fetch
                response = fetch(url, {
                    'method': 'GET',
                    'headers': self.get_headers()
                })
                return response.status == 200
            else:
                response = requests.get(url, headers=self.get_headers(), timeout=10)
                return response.status_code == 200
        except:
            return False
    
    def download_players(self):
        """Scarica tutti i giocatori da GitHub"""
        players = []
        try:
            if not self.is_authenticated():
                return players
                
            url = f"{self.base_url}/{PLAYERS_FOLDER}"
            if WEB_MODE:
                from js import fetch
                response = fetch(url, {
                    'method': 'GET',
                    'headers': self.get_headers()
                })
                if response.status != 200:
                    return players
                files = response.json()
            else:
                response = requests.get(url, headers=self.get_headers(), timeout=10)
                response.raise_for_status()
                files = response.json()
            
            for file in files:
                if file['name'].endswith('.json'):
                    if WEB_MODE:
                        content_response = fetch(file['download_url'])
                        if content_response.status != 200:
                            continue
                        content_text = content_response.text()
                        player_data = json.loads(content_text)
                    else:
                        content_response = requests.get(file['download_url'], timeout=10)
                        content_response.raise_for_status()
                        player_data = json.loads(content_response.text)
                    
                    # Cerca l'immagine associata
                    base_name = os.path.splitext(file['name'])[0]
                    img_file = next((f for f in files if f['name'].startswith(base_name) and 
                                    f['name'].lower().endswith(('.png', '.jpg', '.jpeg'))), None)
                    
                    if img_file:
                        player_data['image_url'] = img_file['download_url']
                    
                    players.append(player_data)
        
        except Exception as e:
            print(f"Errore download giocatori: {str(e)}")
            if not WEB_MODE:
                messagebox.showerror("Errore", f"Impossibile scaricare i giocatori:\n{str(e)}")
        
        return players
    
    def get_player_image(self, player_data, size=(50, 50)):
        """Ottiene l'immagine del giocatore"""
        if 'image_url' not in player_data:
            return None
            
        cache_key = f"{player_data['image_url']}_{size[0]}_{size[1]}"
        if cache_key in self.image_cache:
            return self.image_cache[cache_key]
            
        try:
            if WEB_MODE:
                # In web mode restituiamo direttamente l'URL
                return player_data['image_url']
            else:
                response = requests.get(player_data['image_url'], timeout=10)
                if response.status_code == 200:
                    img = Image.open(BytesIO(response.content))
                    img = img.resize(size, Image.LANCZOS)
                    photo = ImageTk.PhotoImage(img)
                    self.image_cache[cache_key] = photo
                    return photo
        except Exception as e:
            print(f"Errore download immagine: {str(e)}")
        
        return None
    
    def upload_file(self, path, content, message):
        """Carica un file su GitHub"""
        try:
            if not self.is_authenticated():
                return False
                
            # Controlla se il file esiste già
            url = f"{self.base_url}/{path}"
            headers = self.get_headers()
            
            # Prepara i dati
            data = {
                "message": message,
                "content": base64.b64encode(content).decode('utf-8'),
                "branch": "main"
            }
            
            # Prova a ottenere SHA del file esistente
            if WEB_MODE:
                from js import fetch
                response = fetch(url, {
                    'method': 'GET',
                    'headers': headers
                })
                if response.status == 200:
                    file_info = response.json()
                    data["sha"] = file_info.get("sha")
            else:
                try:
                    response = requests.get(url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        data["sha"] = response.json().get("sha")
                except:
                    pass
            
            # Carica il file
            if WEB_MODE:
                response = fetch(url, {
                    'method': 'PUT',
                    'headers': headers,
                    'body': json.dumps(data)
                })
                return response.status == 200
            else:
                response = requests.put(url, headers=headers, json=data, timeout=10)
                response.raise_for_status()
                return True
        except Exception as e:
            print(f"Errore upload file: {str(e)}")
            return False
    
    async def upload_player(self, player_data, image_path):
        """Carica un nuovo giocatore su GitHub (async per web)"""
        try:
            # Salva dati giocatore
            json_content = json.dumps(player_data, indent=4).encode('utf-8')
            json_path = f"{PLAYERS_FOLDER}/{player_data['nome']}_{player_data['cognome']}.json"
            
            if not self.upload_file(json_path, json_content, f"Aggiunto giocatore {player_data['nome']}"):
                return False
            
            # Se c'è un'immagine, caricala
            if image_path:
                if WEB_MODE:
                    # In web mode, image_path è un blob URL
                    from js import fetch
                    response = await fetch(image_path)
                    if response.status != 200:
                        return False
                    array_buffer = await response.arrayBuffer()
                    img_content = array_buffer.to_bytes()
                else:
                    if not os.path.exists(image_path):
                        return False
                    with open(image_path, 'rb') as img_file:
                        img_content = img_file.read()
                
                img_ext = ".png"  # Assumiamo PNG in web mode
                if not WEB_MODE:
                    img_ext = os.path.splitext(image_path)[1]
                img_path = f"{PLAYERS_FOLDER}/{player_data['nome']}_{player_data['cognome']}{img_ext}"
                
                if not self.upload_file(img_path, img_content, f"Immagine per {player_data['nome']}"):
                    return False
            
            return True
        except Exception as e:
            print(f"Errore upload giocatore: {str(e)}")
            return False
    
    def upload_ratings(self, ratings_data):
        """Carica valutazioni su GitHub"""
        try:
            safe_name = re.sub(r'[^a-zA-Z0-9]', '_', ratings_data['valutatore'])
            filename = f"Valutazioni_{safe_name}.json"
            json_content = json.dumps(ratings_data, indent=4).encode('utf-8')
            path = f"{RATINGS_FOLDER}/{filename}"
            
            return self.upload_file(path, json_content, f"Valutazioni di {ratings_data['valutatore']}")
        except Exception as e:
            print(f"Errore upload valutazioni: {str(e)}")
            return False

    def download_user_ratings(self, username):
        """Scarica le valutazioni specifiche di un utente"""
        try:
            if not self.is_authenticated():
                return None

            safe_name = re.sub(r'[^a-zA-Z0-9]', '_', username)
            filename = f"Valutazioni_{safe_name}.json"
            url = f"{self.base_url}/{RATINGS_FOLDER}/{filename}"
            
            if WEB_MODE:
                from js import fetch
                response = fetch(url, headers=self.get_headers())
                if response.status != 200:
                    return None
                file_content = response.json()
                content = file_content['content']
                decoded_content = base64.b64decode(content).decode('utf-8')
                return json.loads(decoded_content)
            else:
                response = requests.get(url, headers=self.get_headers(), timeout=10)
                if response.status_code == 200:
                    content = response.json()['content']
                    decoded_content = base64.b64decode(content).decode('utf-8')
                    return json.loads(decoded_content)
        except:
            return None

    def download_user_credentials(self, nome, cognome):
        """Scarica le credenziali dell'utente"""
        try:
            if not self.is_authenticated():
                return None

            safe_name = f"{nome}_{cognome}".replace(' ', '_')
            filename = f"{safe_name}.json"
            url = f"{self.base_url}/{USERS_FOLDER}/{filename}"
            
            if WEB_MODE:
                from js import fetch
                response = fetch(url, headers=self.get_headers())
                if response.status != 200:
                    return None
                file_content = response.json()
                content = file_content['content']
                decoded_content = base64.b64decode(content).decode('utf-8')
                return json.loads(decoded_content)
            else:
                response = requests.get(url, headers=self.get_headers(), timeout=10)
                if response.status_code == 200:
                    content = response.json()['content']
                    decoded_content = base64.b64decode(content).decode('utf-8')
                    return json.loads(decoded_content)
        except:
            return None

    def delete_player(self, player_data):
        """Elimina un giocatore dal repository GitHub"""
        try:
            base_name = f"{player_data['nome']}_{player_data['cognome']}"
            json_path = f"{PLAYERS_FOLDER}/{base_name}.json"
            json_url = f"{self.base_url}/{json_path}"
            
            if WEB_MODE:
                from js import fetch
                response = fetch(json_url, headers=self.get_headers())
                if response.status == 200:
                    file_info = response.json()
                    sha = file_info.get("sha")
                    data = {
                        "message": f"Eliminato giocatore {player_data['nome']}",
                        "sha": sha,
                        "branch": "main"
                    }
                    delete_response = fetch(json_url, {
                        'method': 'DELETE',
                        'headers': self.get_headers(),
                        'body': json.dumps(data)
                    })
                    if delete_response.status != 200:
                        return False
            else:
                response = requests.get(json_url, headers=self.get_headers(), timeout=10)
                if response.status_code == 200:
                    sha = response.json().get("sha")
                    data = {
                        "message": f"Eliminato giocatore {player_data['nome']}",
                        "sha": sha,
                        "branch": "main"
                    }
                    delete_response = requests.delete(json_url, headers=self.get_headers(), json=data, timeout=10)
                    if delete_response.status_code != 200:
                        return False
            
            if 'image_url' in player_data:
                img_filename = player_data['image_url'].split('/')[-1]
                img_path = f"{PLAYERS_FOLDER}/{img_filename}"
                img_url = f"{self.base_url}/{img_path}"
                
                if WEB_MODE:
                    response = fetch(img_url, headers=self.get_headers())
                    if response.status == 200:
                        file_info = response.json()
                        sha = file_info.get("sha")
                        data = {
                            "message": f"Eliminata immagine per {player_data['nome']}",
                            "sha": sha,
                            "branch": "main"
                        }
                        delete_response = fetch(img_url, {
                            'method': 'DELETE',
                            'headers': self.get_headers(),
                            'body': json.dumps(data)
                        })
                        if delete_response.status != 200:
                            return False
                else:
                    response = requests.get(img_url, headers=self.get_headers(), timeout=10)
                    if response.status_code == 200:
                        sha = response.json().get("sha")
                        data = {
                            "message": f"Eliminata immagine per {player_data['nome']}",
                            "sha": sha,
                            "branch": "main"
                        }
                        delete_response = requests.delete(img_url, headers=self.get_headers(), json=data, timeout=10)
                        if delete_response.status_code != 200:
                            return False
            
            return True
        except Exception as e:
            print(f"Errore eliminazione giocatore: {str(e)}")
            return False

class FootballApp:
    def __init__(self, root=None):
        if not WEB_MODE:
            self.root = root
            # Only set title if root exists
            if self.root:
                self.root.title("CalcioDM3 - Companion")
                self.root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
                self.root.resizable(False, False)
                self.root.configure(bg=BG_COLOR)
        
        self.current_user = {"nome": "", "cognome": ""}
        self.players = []
        self.current_image_path = ""
        self.github_manager = GitHubManager()
        self.user_ratings_cache = {}
        
        if not WEB_MODE:
            self.style = ttk.Style()
            self.style.configure(".", background=BG_COLOR)
            self.style.configure("TFrame", background=BG_COLOR)
            self.style.configure("TButton", font=("Arial", 9), padding=3, background="#FFFFFF", foreground="#000000")
            self.style.configure("Title.TLabel", font=("Arial", 14, "bold"), background=BG_COLOR, foreground="#000000")
            self.style.configure("Header.TLabel", font=("Arial", 12, "bold"), background=BG_COLOR, foreground="#000000")
            self.style.configure("Normal.TLabel", font=("Arial", 9), background=BG_COLOR)
            self.style.configure("Small.TButton", font=("Arial", 8), padding=2)
    
    def run(self):
        if WEB_MODE:
            self.run_web()
        else:
            self.run_desktop()
    
    def run_desktop(self):
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        x = (screen_width - WINDOW_WIDTH) // 2
        y = (screen_height - WINDOW_HEIGHT) // 4
        self.root.geometry(f"+{x}+{y}")
        
        if not self.github_manager.test_connection():
            messagebox.showerror("Errore", 
                "Connessione a GitHub fallita!\n"
                "Possibili cause:\n"
                "1. Problemi di rete\n"
                "2. Token non valido\n"
                "3. Repository non trovato\n\n"
                "L'applicazione verrà chiusa.")
            sys.exit()
        else:
            self.load_players()
            self.create_login_screen()
    
    def run_web(self):
        self.create_login_screen_web()
    
    def load_players(self):
        try:
            self.players = self.github_manager.download_players()
            for idx, player in enumerate(self.players):
                player['id'] = idx + 1
            print(f"Caricati {len(self.players)} giocatori")
        except Exception as e:
            print(f"Errore caricamento giocatori: {str(e)}")
            self.players = []
    
    # ================================================
    # METODI COMUNI
    # ================================================
    
    def login(self, nome=None, cognome=None, pin=None):
        if WEB_MODE:
            if not nome or not cognome or not pin:
                self.web_alert("Errore", "Inserisci nome, cognome e PIN")
                return False
        else:
            nome = self.nome_entry.get().strip()
            cognome = self.cognome_entry.get().strip()
            pin = self.pin_entry.get().strip()
            
            if not nome or not cognome or not pin:
                messagebox.showerror("Errore", "Inserisci nome, cognome e PIN")
                return
        
        credentials = self.github_manager.download_user_credentials(nome, cognome)
        
        if not credentials:
            if WEB_MODE:
                self.web_alert("Errore", "Utente non trovato")
                return False
            else:
                messagebox.showerror("Errore", "Utente non trovato")
                return
        
        if credentials.get('PIN') != pin:
            if WEB_MODE:
                self.web_alert("Errore", "PIN errato")
                return False
            else:
                messagebox.showerror("Errore", "PIN errato")
                return
        
        self.current_user = {"nome": nome, "cognome": cognome}
        self.load_user_ratings()
        
        if WEB_MODE:
            self.create_main_menu_web()
            return True
        else:
            self.create_main_menu()
    
    def load_user_ratings(self):
        username = f"{self.current_user['nome']} {self.current_user['cognome']}"
        ratings = self.github_manager.download_user_ratings(username)
        self.user_ratings_cache = ratings if ratings else {}
    
    def refresh_data(self):
        try:
            self.load_players()
            self.load_user_ratings()
            msg = "Dati aggiornati con successo!\n" \
                  f"- {len(self.players)} giocatori\n" \
                  f"- {len(self.user_ratings_cache.get('valutazioni', {}))} valutazioni"
            
            if WEB_MODE:
                self.web_alert("Successo", msg)
            else:
                messagebox.showinfo("Successo", msg)
        except Exception as e:
            error_msg = f"Impossibile aggiornare i dati:\n{str(e)}"
            if WEB_MODE:
                self.web_alert("Errore", error_msg)
            else:
                messagebox.showerror("Errore", error_msg)
    
    # ================================================
    # METODI DESKTOP (TKINTER)
    # ================================================
    
    def create_login_screen(self):
        self.clear_window()
        
        main_frame = tk.Frame(self.root, padx=10, pady=10, bg=BG_COLOR)
        main_frame.pack(expand=True, fill="both")
        
        title = ttk.Label(main_frame, text="CalcioDM3 - Companion", style="Title.TLabel")
        title.pack(pady=(10, 20))
        
        input_frame = ttk.Frame(main_frame)
        input_frame.pack(pady=10, fill="x")
        
        ttk.Label(input_frame, text="Nome:", style="Normal.TLabel").grid(row=0, column=0, padx=5, pady=5, sticky="e")
        self.nome_entry = ttk.Entry(input_frame, font=("Arial", 9), width=15)
        self.nome_entry.grid(row=0, column=1, padx=5, pady=5, sticky="we")
        self.nome_entry.focus()
        
        ttk.Label(input_frame, text="Cognome:", style="Normal.TLabel").grid(row=1, column=0, padx=5, pady=5, sticky="e")
        self.cognome_entry = ttk.Entry(input_frame, font=("Arial", 9), width=15)
        self.cognome_entry.grid(row=1, column=1, padx=5, pady=5, sticky="we")
        
        ttk.Label(input_frame, text="PIN:", style="Normal.TLabel").grid(row=2, column=0, padx=5, pady=5, sticky="e")
        self.pin_entry = ttk.Entry(input_frame, font=("Arial", 9), width=15, show="*")
        self.pin_entry.grid(row=2, column=1, padx=5, pady=5, sticky="we")
        
        login_btn = ttk.Button(main_frame, text="Accedi", command=self.login, style="TButton")
        login_btn.pack(pady=(10, 20))
        
        try:
            logo_path = resource_path("Logo.png")
            if os.path.exists(logo_path):
                logo_img = Image.open(logo_path)
                new_width = int(logo_img.width * 0.3)
                new_height = int(logo_img.height * 0.3)
                logo_img = logo_img.resize((new_width, new_height), Image.LANCZOS)
                self.logo_photo = ImageTk.PhotoImage(logo_img)
                
                logo_frame = tk.Frame(main_frame, bg=BG_COLOR)
                logo_frame.pack(fill="both", expand=True)
                
                logo_label = tk.Label(logo_frame, image=self.logo_photo, bg=BG_COLOR)
                logo_label.pack(pady=(20, 0))
        except Exception as e:
            print(f"Errore caricamento logo: {str(e)}")
        
        input_frame.columnconfigure(1, weight=1)
        main_frame.columnconfigure(0, weight=1)
    
    def create_main_menu(self):
        self.clear_window()
        
        main_frame = tk.Frame(self.root, padx=10, pady=10, bg=BG_COLOR)
        main_frame.pack(expand=True, fill="both")
        
        welcome = ttk.Label(main_frame, text=f"Benvenuto, {self.current_user['nome']}", style="Header.TLabel")
        welcome.pack(pady=(10, 20))
        
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(pady=15, fill="x")
        
        full_name = f"{self.current_user['nome']} {self.current_user['cognome']}"
        if full_name in ADMIN_USERS:
            new_player_btn = ttk.Button(btn_frame, text="Inserisci Giocatore", command=self.create_new_player_screen, style="TButton")
            new_player_btn.pack(fill="x", pady=3)
            
            delete_player_btn = ttk.Button(btn_frame, text="Elimina Giocatore", command=self.create_delete_player_screen, style="TButton")
            delete_player_btn.pack(fill="x", pady=3)
        
        rate_btn = ttk.Button(btn_frame, text="Valuta Giocatori", command=self.create_rating_screen, style="TButton")
        rate_btn.pack(fill="x", pady=3)
        
        share_btn = ttk.Button(btn_frame, text="Condividi Valutazioni", command=self.prepare_share_ratings, style="TButton")
        share_btn.pack(fill="x", pady=3)
        
        refresh_btn = ttk.Button(btn_frame, text="Aggiorna Dati", command=self.refresh_data, style="TButton")
        refresh_btn.pack(fill="x", pady=3)
        
        exit_btn = ttk.Button(btn_frame, text="Esci", command=self.root.quit, style="TButton")
        exit_btn.pack(fill="x", pady=3)
        
        main_frame.columnconfigure(0, weight=1)
    
    def create_new_player_screen(self):
        # ... (codice desktop esistente) ...
        pass
    
    def create_delete_player_screen(self):
        # ... (codice desktop esistente) ...
        pass
    
    def create_rating_screen(self):
        # ... (codice desktop esistente) ...
        pass
    
    def rate_player(self, player):
        # ... (codice desktop esistente) ...
        pass
    
    def prepare_share_ratings(self):
        valutatore = f"{self.current_user['nome']} {self.current_user['cognome']}"
        ratings_data = {
            "valutatore": valutatore,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "valutazioni": self.user_ratings_cache.get('valutazioni', {})
        }
        
        if not ratings_data['valutazioni']:
            if WEB_MODE:
                self.web_alert("Nessuna valutazione", "Non hai ancora valutato nessun giocatore.")
            else:
                messagebox.showinfo("Nessuna valutazione", "Non hai ancora valutato nessun giocatore.")
            return
        
        def upload_thread():
            if self.github_manager.upload_ratings(ratings_data):
                if WEB_MODE:
                    self.web_alert("Successo", "Valutazioni caricate con successo su GitHub!")
                else:
                    messagebox.showinfo("Successo", "Valutazioni caricate con successo su GitHub!")
            else:
                error_msg = "Impossibile caricare le valutazioni su GitHub"
                if WEB_MODE:
                    self.web_alert("Errore", error_msg)
                else:
                    messagebox.showerror("Errore", error_msg)
        
        threading.Thread(target=upload_thread, daemon=True).start()
        
        if not WEB_MODE:
            messagebox.showinfo("Successo", "Valutazioni in corso di caricamento su GitHub!")
    
    def clear_window(self):
        if not WEB_MODE:
            for widget in self.root.winfo_children():
                widget.destroy()
    
    # ================================================
    # METODI WEB (HTML/JS)
    # ================================================
    
    def create_login_screen_web(self):
        html = """
        <div class="login-screen">
            <div class="header">
                <h1>CalcioDM3 - Companion</h1>
            </div>
            
            <div class="login-form">
                <input type="text" id="nome" placeholder="Nome" class="form-input">
                <input type="text" id="cognome" placeholder="Cognome" class="form-input">
                <input type="password" id="pin" placeholder="PIN" class="form-input">
                <button onclick="app.login()" class="btn">Accedi</button>
            </div>
            
            <div class="logo-container">
                <img src="assets/logo.png" alt="Logo CalcioDM3" class="logo">
            </div>
        </div>
        """
        self.display_html(html)
    
    def create_main_menu_web(self):
        full_name = f"{self.current_user['nome']} {self.current_user['cognome']}"
        is_admin = full_name in ADMIN_USERS
        
        admin_section = ""
        if is_admin:
            admin_section = """
            <button onclick="app.showScreen('new-player')" class="btn">Inserisci Giocatore</button>
            <button onclick="app.showScreen('delete-player')" class="btn">Elimina Giocatore</button>
            """
        
        html = f"""
        <div class="main-menu">
            <div class="header">
                <h1>Benvenuto, {self.current_user['nome']}</h1>
            </div>
            
            <div class="menu-options">
                {admin_section}
                <button onclick="app.showScreen('rate-players')" class="btn">Valuta Giocatori</button>
                <button onclick="app.prepare_share_ratings()" class="btn">Condividi Valutazioni</button>
                <button onclick="app.refresh_data()" class="btn">Aggiorna Dati</button>
                <button onclick="app.logout()" class="btn">Esci</button>
            </div>
        </div>
        """
        self.display_html(html)
    
    def create_new_player_screen_web(self):
        html = """
        <div class="new-player-screen">
            <div class="header">
                <h1>Nuovo Giocatore</h1>
            </div>
            
            <div class="content">
                <div class="image-section">
                    <img id="player-image-preview" src="assets/placeholder.jpg" alt="Anteprima immagine" class="player-image">
                    <button onclick="document.getElementById('player-image-input').click()" class="btn">Carica Foto</button>
                    <input type="file" id="player-image-input" accept="image/*" style="display: none;" onchange="app.previewImage(event)">
                </div>
                
                <div class="form-section">
                    <div class="form-group">
                        <label for="player-nome">Nome:</label>
                        <input type="text" id="player-nome" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="player-cognome">Cognome:</label>
                        <input type="text" id="player-cognome" class="form-input">
                    </div>
                </div>
            </div>
            
            <div class="actions">
                <button onclick="app.savePlayer()" class="btn">Salva</button>
                <button onclick="app.showScreen('main-menu')" class="btn">Indietro</button>
            </div>
        </div>
        """
        self.display_html(html)
    
    def create_delete_player_screen_web(self):
        # Genera la lista dei giocatori come griglia
        players_html = ""
        for player in self.players:
            img_url = self.github_manager.get_player_image(player) or "assets/placeholder.jpg"
            players_html += f"""
            <div class="player-card" onclick="app.confirmDeletePlayer({player['id']})">
                <img src="{img_url}" alt="{player['nome']}" class="player-thumb">
                <div class="player-name">{player['nome']} {player['cognome']}</div>
            </div>
            """
        
        html = f"""
        <div class="delete-player-screen">
            <div class="header">
                <h1>Elimina Giocatore</h1>
                <p>Clicca su un giocatore per eliminarlo</p>
            </div>
            
            <div class="player-grid">
                {players_html}
            </div>
            
            <div class="actions">
                <button onclick="app.showScreen('main-menu')" class="btn">Indietro</button>
            </div>
        </div>
        """
        self.display_html(html)
    
    def create_rate_players_screen_web(self):
        # Genera la lista dei giocatori come griglia
        players_html = ""
        for player in self.players:
            img_url = self.github_manager.get_player_image(player) or "assets/placeholder.jpg"
            players_html += f"""
            <div class="player-card" onclick="app.ratePlayer({player['id']})">
                <img src="{img_url}" alt="{player['nome']}" class="player-thumb">
                <div class="player-name">{player['nome']} {player['cognome']}</div>
            </div>
            """
        
        html = f"""
        <div class="rate-players-screen">
            <div class="header">
                <h1>Valuta Giocatori</h1>
                <p>Clicca su un giocatore per valutarlo</p>
            </div>
            
            <div class="player-grid">
                {players_html}
            </div>
            
            <div class="actions">
                <button onclick="app.showScreen('main-menu')" class="btn">Indietro</button>
            </div>
        </div>
        """
        self.display_html(html)
    
    def create_rate_player_screen_web(self, player_id):
        player = next((p for p in self.players if p['id'] == player_id), None)
        if not player:
            self.web_alert("Errore", "Giocatore non trovato")
            return
        
        player_full_name = f"{player['nome']} {player['cognome']}"
        valutazioni_precedenti = self.user_ratings_cache.get('valutazioni', {}).get(player_full_name, {})
        
        # Costruisci i slider per ogni skill
        skills = ["Tiro", "Velocità", "Tecnica", "Difesa", "Fisico", "Visione"]
        sliders_html = ""
        for skill in skills:
            valore = valutazioni_precedenti.get(skill, 50)
            sliders_html += f"""
            <div class="skill-row">
                <label>{skill}</label>
                <input type="range" min="0" max="100" value="{valore}" class="skill-slider" id="slider-{skill}">
                <span id="value-{skill}">{valore}</span>
            </div>
            """
        
        html = f"""
        <div class="rate-player-screen">
            <div class="header">
                <h1>Valuta {player['nome']}</h1>
            </div>
            
            <div class="skills-container">
                {sliders_html}
            </div>
            
            <div class="actions">
                <button onclick="app.saveRating({player_id})" class="btn">Salva Valutazione</button>
                <button onclick="app.showScreen('rate-players')" class="btn">Annulla</button>
            </div>
        </div>
        <script>
            // Aggiorna i valori quando si muove lo slider
            document.querySelectorAll('.skill-slider').forEach(slider => {{
                const skill = slider.id.split('-')[1];
                slider.addEventListener('input', () => {{
                    document.getElementById('value-' + skill).textContent = slider.value;
                }});
            }});
        </script>
        """
        self.display_html(html)
    
    # ================================================
    # GESTIONE EVENTI WEB (chiamati da JavaScript)
    # ================================================
    
    def handle_web_event(self, event, data=None):
        if event == "save_player":
            return self.save_player_web(data)
        elif event == "confirm_delete_player":
            return self.confirm_delete_player_web(data)
        elif event == "rate_player":
            return self.rate_player_web(data)
        elif event == "save_rating":
            return self.save_rating_web(data)
        else:
            return {"status": "error", "message": "Evento non riconosciuto"}
    
    def save_player_web(self, data):
        nome = data.get('nome')
        cognome = data.get('cognome')
        image_data = data.get('image')  # base64 o null
        
        if not nome or not cognome:
            return {"status": "error", "message": "Inserisci nome e cognome"}
        
        player_data = {
            'nome': nome,
            'cognome': cognome
        }
        
        # Salva l'immagine temporaneamente (in web, non abbiamo un percorso file)
        image_path = None
        if image_data:
            # In un'app reale, qui dovremmo salvare l'immagine in un blob o in IndexedDB
            # Per semplicità, passiamo l'immagine come base64 al metodo upload_player
            pass
        
        # Carica il giocatore
        if self.github_manager.upload_player(player_data, image_path):
            return {"status": "success", "message": "Giocatore caricato con successo!"}
        else:
            return {"status": "error", "message": "Errore nel caricamento del giocatore"}
    
    def confirm_delete_player_web(self, player_id):
        player = next((p for p in self.players if p['id'] == player_id), None)
        if not player:
            return {"status": "error", "message": "Giocatore non trovato"}
        
        if self.github_manager.delete_player(player):
            self.load_players()
            return {"status": "success", "message": "Giocatore eliminato con successo!"}
        else:
            return {"status": "error", "message": "Errore durante l'eliminazione"}
    
    def rate_player_web(self, player_id):
        # Mostra la schermata di valutazione
        self.create_rate_player_screen_web(player_id)
        return {"status": "success"}
    
    def save_rating_web(self, data):
        player_id = data.get('player_id')
        ratings = data.get('ratings')  # Dizionario {skill: valore}
        
        player = next((p for p in self.players if p['id'] == player_id), None)
        if not player:
            return {"status": "error", "message": "Giocatore non trovato"}
        
        player_full_name = f"{player['nome']} {player['cognome']}"
        if 'valutazioni' not in self.user_ratings_cache:
            self.user_ratings_cache['valutazioni'] = {}
        
        self.user_ratings_cache['valutazioni'][player_full_name] = ratings
        
        return {"status": "success", "message": "Valutazione salvata!"}
    
    def display_html(self, html):
        if WEB_MODE:
            from js import updateUI
            updateUI(html)
    
    def web_alert(self, title, message):
        if WEB_MODE:
            from js import alert
            alert(f"{title}\n\n{message}")

# ================================================
# PUNTO DI INGRESSO
# ================================================

if __name__ == "__main__":
    if WEB_MODE:
        import pyodide_http
        pyodide_http.patch_all()
        
        app = FootballApp()
        app.run_web()
    else:
        root = tk.Tk()
        app = FootballApp(root)
        app.run()
