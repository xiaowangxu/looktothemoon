import type { Edge } from "./Edge";
import type { Loop } from "./Loop";
import type { Vertex } from "./Vertex";

export class Face {
    public boundary_loop: Loop | undefined = undefined;
}