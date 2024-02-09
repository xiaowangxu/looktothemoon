import type { Face } from "./Face";
import type { Edge } from "./Edge";
import type { Vertex } from "./Vertex";

export class Loop {
    public vertex: Vertex;
    public edge: Edge;
    public face: Face;
    public next_loop: Loop = this;
    public prev_loop: Loop = this;
    public radial_next_loop: Loop = this;
    public radial_prev_loop: Loop = this;

    constructor(v: Vertex, e: Edge, f: Face) {
        this.vertex = v;
        this.edge = e;
        this.face = f;
    }
}