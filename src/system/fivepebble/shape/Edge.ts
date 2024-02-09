import type { Face } from "./Face";
import type { Loop } from "./Loop";
import { ShapeElement } from "./ShapeElement";
import type { Vertex } from "./Vertex";

export class VertexDiskLoop {
    public next_edge: Edge;
    public prev_edge: Edge;

    constructor(e: Edge) {
        this.next_edge = e;
        this.prev_edge = e;
    }
}

export class Edge extends ShapeElement {
    public vertex_0: Vertex;
    public vertex_1: Vertex;
    public readonly vertex_disk_loop_0 = new VertexDiskLoop(this);
    public readonly vertex_disk_loop_1 = new VertexDiskLoop(this);
    public loop: Loop | undefined = undefined;

    constructor(v0: Vertex, v1: Vertex) {
        super();
        this.vertex_0 = v0;
        this.vertex_1 = v1;
    }
}