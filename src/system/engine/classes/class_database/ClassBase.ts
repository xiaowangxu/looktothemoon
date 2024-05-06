import { type Rid, RID } from "../../Rid";
import type { ClassWriter, ClassReader } from "../saver_loader/ClassWriterReader";

export class ClassBase {
    public static readonly class_name: string = "ClassBase";

    public readonly rid: Rid = RID();

    public dump(writer: ClassWriter): void {
        throw new Error("<ClassBase> dump: base method should not be called, may be this class not implement its own dump method");
    }

    public load(reader: ClassReader): void {
        throw new Error("<ClassBase> dump: base method should not be called, may be this class not implement its own load method");
    }
}