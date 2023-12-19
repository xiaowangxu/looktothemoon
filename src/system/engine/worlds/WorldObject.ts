import type { RID } from "../Rid";

export abstract class WorldObject {
    public readonly rid: RID;

    constructor(rid: RID) {
        this.rid = rid;
    }

    public abstract dispose(): void;
}