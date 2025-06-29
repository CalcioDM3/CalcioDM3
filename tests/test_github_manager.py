import sys
import os
# Add parent directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

import unittest
from unittest.mock import patch, MagicMock
from main import GitHubManager

class TestGitHubManager(unittest.TestCase):
    @patch('main.requests')
    def test_test_connection_success(self, mock_requests):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_requests.get.return_value = mock_response
        
        manager = GitHubManager()
        self.assertTrue(manager.test_connection())
    
    @patch('main.requests')
    def test_test_connection_failure(self, mock_requests):
        mock_requests.get.side_effect = Exception("Connection error")
        
        manager = GitHubManager()
        self.assertFalse(manager.test_connection())

    @patch('main.requests')
    def test_download_players(self, mock_requests):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {'name': 'player1.json', 'download_url': 'https://example.com/player1.json'},
            {'name': 'player1.jpg', 'download_url': 'https://example.com/player1.jpg'}
        ]
        mock_requests.get.return_value = mock_response
        
        content_response = MagicMock()
        content_response.text = '{"nome": "Mario", "cognome": "Rossi"}'
        mock_requests.get.side_effect = [mock_response, content_response]
        
        manager = GitHubManager()
        players = manager.download_players()
        self.assertEqual(len(players), 1)
        self.assertEqual(players[0]['nome'], "Mario")
        self.assertEqual(players[0]['cognome'], "Rossi")

if __name__ == '__main__':
    unittest.main()
