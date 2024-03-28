import type { Edge } from "./Edge";
import type { Loop } from "./Loop";
import { ShapeElement } from "./ShapeElement";
import type { Vertex } from "./Vertex";

export class Face extends ShapeElement {
    public boundary_loop!: Loop;
}