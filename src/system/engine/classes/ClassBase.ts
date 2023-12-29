import type { ClassReader, ClassWriter } from "./ClassWriterReader";
import { Rid, type RID } from "../Rid";
import { ConfiguredObject } from "../ConfiguredObject";

export class ClassBase extends ConfiguredObject {
    public static readonly class_name: string = "ClassBase";

    public readonly rid: RID = Rid();

    public dump(writer: ClassWriter): void {
        throw new Error("abstract method");
    }

    public load(reader: ClassReader): void {
        throw new Error("abstract method");
    }
}