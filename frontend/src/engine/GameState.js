export class GameState {
    constructor() {
        this.players = new Map(); 
        
        this.bombs = []; 
        this.explosions = []; 
        this.powerUps = []; 
        
        this.map = {
            width: 15,
            height: 13,
            grid: []
        };
        
        this.status = 'LOBBY'; 
    }

    updatePlayer(id, data) {
        if (this.players.has(id)) {
            const player = this.players.get(id);

            Object.assign(player, data); 
        } else {
            this.players.set(id, data); 
        }
    }

   
}