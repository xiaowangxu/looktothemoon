import { type Rid, RID } from "../../Rid";
import type { ClassWriter, ClassReader } from "../saver_loader/ClassWriterReader";

export class ClassBase {
    public static readonly class_name: string = "ClassBase";

    public readonly rid: Rid = RID();

    public dump(writer: ClassWriter): void {
        throw new Error(`<${this.constructor.name}> dump: dump can not be called, may be this class does not implement its own dump method`);
    }

    public load(reader: ClassReader): void {
        throw new Error(`<${this.constructor.name}> load: load can not be called, may be this class does not implement its own load method`);
    }
}