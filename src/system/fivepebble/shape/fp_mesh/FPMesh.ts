import { Vector3 } from "../../linear_algebra/Vector3";
import { Edge } from "../Edge";
import { Face } from "../Face";
import { Loop } from "../Loop";
import { Shape } from "../Shape";
import { Vertex } from "../Vertex";

export class FPVertex extends Vertex {
    protected _position: Vector3 = Vector3.new;
    public get position() { return this._position.clone(); }
    public get_Position(target: Vector3) {
        return target.copy(this._position);
    }
    public set position(position: Vector3) {
        this._position.copy(position);
    }

    protected _normal: Vector3 = Vector3.create(0, 1, 0);
    public get normal() { return this._normal.clone(); }
    public get_Normal(target: Vector3) {
        return target.copy(this._normal);
    }
    public set normal(normal: Vector3) {
        this._normal.copy(normal);
    }
}

export class FPMesh extends Shape<FPVertex> {

    constructor() {
        super(FPVertex, Edge, Loop, Face);
    }

}