import { ConfiguredObject, type Config } from "../ConfiguredObject";
import type { Rid } from "../Rid";

export abstract class WorldObject extends ConfiguredObject {
    public readonly rid: Rid;

    constructor(config: Config, rid: Rid) {
        super(config);
        this.rid = rid;
    }

    public abstract dispose(): void;
}