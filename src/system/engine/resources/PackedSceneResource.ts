import { Resource } from "../Resource";
import type { Node } from "../SceneTree";
import { ClassReader, ClassRef, ClassWriter } from "../classes/ClassWriterReader";
import { ValueObject } from "../classes/ValueObject";

export class PackedSceneResource extends Resource {
    public static readonly class_name: string = 'PackedSceneResource';

    public get unique() { return true; }
    public set unique(unique: boolean) { /* nop */ }

    private readonly for_save: boolean;

    private _root: Node | undefined;
    
    public get_Root<T extends Node = Node>(): T {
        if (this.for_save) throw new Error('can not get the root from a PackedSceneResource for saving');
        return this._root! as T;
    }

    private parent_list: [parent: ClassRef, child: ClassRef][] = [];

    constructor(root: Node | undefined) {
        super();
        this._root = root;
        this.for_save = this._root !== undefined;
    }
    
    protected dispose(): void { }

    // save / load

    public dump_Node(node: Node, parent: Node | undefined, writer: ClassWriter) {
        const node_refid = writer.ref(node);
        if (parent !== undefined) {
            const parent_refid = writer.ref(parent);
            this.parent_list.push([parent_refid, node_refid]);
        }
        for (const child of node.children) {
            this.dump_Node(child, node, writer);
        }
    }

    public dump(writer: ClassWriter): void {
        if (!this.for_save) throw new Error('this PackedSceneResource is not for saving');
        this.parent_list = [];
        this.dump_Node(this._root!, undefined, writer);
        writer.property('root', writer.ref(this._root!));
        writer.property('parents', new ValueObject(this.parent_list.reverse()));
    }

    public load(reader: ClassReader): void {
        if (this.for_save) throw new Error('this PackedSceneResource can not be loaded');
        const root = reader.get<Node>('root')!;
        const parents = reader.get<ValueObject<[parent: ClassRef, child: ClassRef][]>>('parents')!;
        for (const [parent, child] of parents.value) {
            const parent_node = reader.get<Node>(parent)!;
            const child_node = reader.get<Node>(child)!;
            parent_node.add_Child(child_node);
        }
        this._root = root;
    }
}