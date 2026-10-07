export class Performance {
    constructor() {
        this.lastTime = performance.now();
        this.frames = 0;
        this.fps = 0;
        this.frameDrops = 0;
    }

    measure() {
        const now = performance.now();
        this.frames++;
        
        const delta = now - this.lastTime;
        // Kol 1 taniya (1000ms), kan7esbo ch7al mn frame dazt
        if (delta >= 1000) {
            this.fps = (this.frames * 1000) / delta;
            
            // Ila kante l'FPS 9el mn 58, ra kayn frame drop
            if (this.fps < 58) { 
                this.frameDrops++;
                console.warn(`Frame drop detected! FPS: ${this.fps.toFixed(1)}`);
            }
            
            this.frames = 0;
            this.lastTime = now;
        }
    }

    getStats() {
        return {
            fps: this.fps,
            drops: this.frameDrops
        };
    }
}