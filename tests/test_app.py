import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

import unittest
from unittest.mock import MagicMock, patch
import tkinter as tk
from main import FootballApp

class TestFootballApp(unittest.TestCase):
    @patch('main.FootballApp.load_players')
    @patch('main.GitHubManager.test_connection')
    def test_run_desktop_success(self, mock_test_connection, mock_load_players):
        mock_test_connection.return_value = True
        
        # Create root window with virtual display
        root = tk.Tk()
        root.withdraw()  # Hide the window
        
        app = FootballApp(root)
        app.run_desktop()
        
        mock_load_players.assert_called_once()
        root.destroy()
    
    @patch('main.messagebox.showerror')
    @patch('main.GitHubManager.test_connection')
    def test_run_desktop_failure(self, mock_test_connection, mock_showerror):
        mock_test_connection.return_value = False
        
        # Create root window with virtual display
        root = tk.Tk()
        root.withdraw()  # Hide the window
        
        app = FootballApp(root)
        with self.assertRaises(SystemExit):
            app.run_desktop()
        
        mock_showerror.assert_called_once()
        root.destroy()

    @patch('main.FootballApp.create_main_menu')
    @patch('main.GitHubManager.download_user_credentials')
    def test_login_success(self, mock_credentials, mock_create_menu):
        mock_credentials.return_value = {'PIN': '1234'}
        
        # Create root window with virtual display
        root = tk.Tk()
        root.withdraw()  # Hide the window
        
        app = FootballApp(root)
        app.nome_entry = MagicMock()
        app.nome_entry.get.return_value = "Mario"
        app.cognome_entry = MagicMock()
        app.cognome_entry.get.return_value = "Rossi"
        app.pin_entry = MagicMock()
        app.pin_entry.get.return_value = "1234"
        
        app.login()
        
        mock_create_menu.assert_called_once()
        root.destroy()

if __name__ == '__main__':
    unittest.main()
