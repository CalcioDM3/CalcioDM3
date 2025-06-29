// tests/test_github_manager.js
import { GitHubManager } from '../docs/app.js';

describe('GitHubManager', () => {
    // Mock fetch
    beforeAll(() => {
        global.fetch = jest.fn();
    });

    beforeEach(() => {
        fetch.mockClear();
    });

    test('testConnection success', async () => {
        fetch.mockResolvedValueOnce({ ok: true });
        const result = await GitHubManager.testConnection();
        expect(result).toBe(true);
    });

    test('downloadPlayers success', async () => {
        const mockFiles = [
            { name: 'player1.json', download_url: 'https://example.com/player1.json' },
            { name: 'player1.jpg', download_url: 'https://example.com/player1.jpg' }
        ];
        
        fetch.mockResolvedValueOnce({ 
            ok: true, 
            json: () => Promise.resolve(mockFiles) 
        });
        
        fetch.mockResolvedValueOnce({ 
            ok: true, 
            json: () => Promise.resolve({ nome: "Mario", cognome: "Rossi" }) 
        });
        
        const players = await GitHubManager.downloadPlayers();
        expect(players.length).toBe(1);
        expect(players[0].nome).toBe("Mario");
        expect(players[0].image_url).toBe("https://example.com/player1.jpg");
    });
});
