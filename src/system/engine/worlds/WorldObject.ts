import type { Rid } from "../Rid";

export abstract class WorldObject {
    public readonly rid: Rid;

    constructor(rid: Rid) {
        this.rid = rid;
    }

    public abstract dispose(): void;
}