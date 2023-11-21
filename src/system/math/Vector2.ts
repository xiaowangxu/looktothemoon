
export class Vector2 {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public set(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public equal(b: Vector2) {
        return this.x === b.x && this.y === b.y;
    }
}

export function vec2(x: number = 0, y: number = 0) {
    return new Vector2(x, y);
}