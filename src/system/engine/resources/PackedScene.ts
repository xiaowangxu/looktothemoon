import type { Node } from "../SceneTree";
import { ClassBase } from "../classes/ClassBase";
import { ClassWriter } from "../classes/ClassWriterReader";

export class PackedScene extends ClassBase {
    public static readonly class_name: string = 'PackedScene';
    public static readonly use_custom_instantiater: boolean = true;

    private root: Node;

    constructor(root: Node) {
        super();
        this.root = root;
    }

    public dump(writer: ClassWriter): void {

    }

    public static instantiate(data: any | ClassWriter): ClassBase {
        return new ClassBase();
    }
}