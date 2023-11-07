import type { ClassReader, ClassWriter } from "./ClassWriterReader";
import { Rid } from "../Rid";

export class ClassBase {
    public static readonly class_name: string = "ClassBase";
    public static readonly use_custom_instantiater: boolean = false;

    public readonly rid: string = Rid();

    public dump(writer: ClassWriter) {
        throw new Error("abstract method");
    }

    public load(reader: ClassReader) {
        throw new Error("abstract method");
    }

    public static instantiate(data: any | ClassWriter): ClassBase {
        throw new Error("abstract method");
    }
}