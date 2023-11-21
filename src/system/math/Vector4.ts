
export class Vector4 {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    public get r() { return this.x; }
    public get g() { return this.y; }
    public get b() { return this.z; }
    public get a() { return this.w; }

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public set(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

export function vec4(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
    return new Vector4(x, y, z, w);
}