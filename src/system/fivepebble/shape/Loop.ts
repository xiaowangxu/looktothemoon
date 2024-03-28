import type { Face } from "./Face";
import type { Edge } from "./Edge";
import type { Vertex } from "./Vertex";
import { ShapeElement } from "./ShapeElement";

export class Loop extends ShapeElement {
    public vertex: Vertex;
    public edge: Edge;
    public face: Face;
    public next_loop: Loop = this;
    public prev_loop: Loop = this;
    public radial_next_loop: Loop = this;
    public radial_prev_loop: Loop = this;

    constructor(v: Vertex, e: Edge, f: Face) {
        super();
        this.vertex = v;
        this.edge = e;
        this.face = f;
    }
}