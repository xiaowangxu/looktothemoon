import { Rid } from "./Rid";

export class ClassBase {
    public static readonly class_name: string = "ClassBase";
    public static readonly use_custom_instantiater: boolean = false;

    public readonly rid: string = Rid();

    public static instantiate(data: Object): ClassBase {
        throw new Error("abstract method");
    }
}