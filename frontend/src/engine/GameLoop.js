export class GameLoop {
    constructor(update, render, performanceMonitor) {
        this.update = update;
        this.render = render;
        this.performance = performanceMonitor;
        this.lastTime = 0;
        this.accumulator = 0;
        this.step = 1000 / 60; 
        this.isRunning = false;
        this.animationFrameId = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();

        this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
    loop(currentTime) {
        if (!this.isRunning) return;

        // calcilate deltatime between current frame & old frame
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.accumulator += deltaTime;

        //update data game
        while (this.accumulator >= this.step) {
            this.update(this.step);
            this.accumulator -= this.step;
        }
        // render the game
        this.render();
        // calculate performance
        this.performance.measure();
        // rendder next frame
        this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
    }
}