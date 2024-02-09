import type { Face } from "./Face";
import type { Edge } from "./Edge";
import type { Loop } from "./Loop";
import { ShapeElement } from "./ShapeElement";

export class Vertex extends ShapeElement {
    public edge: Edge | undefined = undefined;
}