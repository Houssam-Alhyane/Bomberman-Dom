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

 
}