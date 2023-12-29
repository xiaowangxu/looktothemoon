import { ConfiguredObject, type Config } from "../ConfiguredObject";
import type { RID } from "../Rid";

export abstract class WorldObject extends ConfiguredObject {
    public readonly rid: RID;

    constructor(config: Config, rid: RID) {
        super(config);
        this.rid = rid;
    }

    public abstract dispose(): void;
}