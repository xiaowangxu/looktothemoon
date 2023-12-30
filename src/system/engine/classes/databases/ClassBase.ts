import { type RID, Rid } from "../../Rid";
import type { ClassWriter, ClassReader } from "../saver_loader/ClassWriterReader";
import { ConfiguredObject } from "../../ConfiguredObject";

export class ClassBase extends ConfiguredObject {
    public static readonly class_name: string = "ClassBase";

    public readonly rid: RID = Rid();

    public dump(writer: ClassWriter): void {
        throw new Error("<ClassBase> dump: base method should not be called, may be this class not implement its own dump method");
    }

    public load(reader: ClassReader): void {
        throw new Error("<ClassBase> dump: base method should not be called, may be this class not implement its own load method");
    }
}