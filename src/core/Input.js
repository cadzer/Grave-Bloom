export class Input {
    constructor() {
        this.keys = {};
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }

    isKeyDown(keyCode) {
        return this.keys[keyCode] === true;
    }

    getMovementDirection() {
        let dx = 0;
        let dy = 0;

        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) {
            dy -= 1;
        }
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) {
            dy += 1;
        }
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) {
            dx -= 1;
        }
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) {
            dx += 1;
        }

        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        return { x: dx, y: dy };
    }
}
