export class SceneTree {
    // private readonly root: Viewport;

    constructor() { }

    public notify_TreeChnage() { }
}



export class Node {

    public name: string = '';

    private scenetree: SceneTree | undefined = undefined;
    private inside_tree: boolean = false;
    private viewport: Viewport | undefined;

    private parent: Node | undefined = undefined;
    private readonly children: Node[] = [];
    private is_ready: boolean = false;
    private first_time_ready: boolean = true;

    constructor() { };

    // scene tree

    private propagate_SceneTreeExiting() {
        for (const child of this.children) {
            child.propagate_SceneTreeExiting();
        }
        // before exit tree
        this.viewport = undefined;
        this.inside_tree = false;
        this.is_ready = false;
        this.scenetree = undefined;
    }

    private propagate_SceneTreeEntering() {
        if (this.parent !== undefined) {
            this.scenetree = this.parent.scenetree;
        }
        if (this instanceof Viewport) {
            this.viewport = this;
        }
        if (this.viewport === undefined && this.parent !== undefined) {
            this.viewport = this.parent.viewport;
        }
        this.inside_tree = true;

        // notification(NOTIFICATION_ENTER_TREE);

        // GDVIRTUAL_CALL(_enter_tree);

        // emit_signal(SceneStringNames::get_singleton()->tree_entered);

        //block while adding children

        for (const child of this.children) {
            if (!child.inside_tree) {
                child.propagate_SceneTreeEntering();
            }
        }
    }

    private propagate_SceneTreeExited() {
        for (const child of this.children) {
            child.propagate_SceneTreeExited();
        }
    }

    private propagate_Ready() {
        this.is_ready = true;
        for (const child of this.children) {
            child.propagate_Ready();
        }

        // after entered tree

        if (this.first_time_ready) {
            this.first_time_ready = false;
            // ready
        }
    }

    private set_SceneTree(scenetree: SceneTree | undefined) {
        if (this.scenetree === scenetree) return;
        const last_scenetree: SceneTree | undefined = this.scenetree;
        if (last_scenetree !== undefined) {
            // exit tree
            this.propagate_SceneTreeExiting();
        }
        this.scenetree = scenetree;
        if (this.scenetree !== undefined) {
            // enter tree
            this.propagate_SceneTreeEntering();
            if (this.parent === undefined || this.parent.is_ready) {
                // ready
                this.propagate_Ready();
            }
        }
        if (last_scenetree !== undefined) last_scenetree.notify_TreeChnage();
        if (this.scenetree !== undefined) this.scenetree.notify_TreeChnage();
    }

    private add_ChildInternal(node: Node) {
        if (node.parent === this) return;
        if (node === this) throw new Error("cannot add child to itself");
        if (node.parent !== undefined) throw new Error("cannot add child to node because it already has a parent");
        // check cyclic dependency
        this.children.push(node);
        node.parent = this;
        // node parent signal
        if (this.scenetree !== undefined) {
            node.set_SceneTree(this.scenetree);
        }
        // children changed siganl
    }

    private remove_ChildInternal(node: Node) {
        const idx = this.get_ChildIndex(node);
        if (idx < 0) return;
        node.set_SceneTree(undefined);
        // remove child
        // node unparent
        this.children.splice(idx, 1);
        node.parent = undefined;
        if (this.inside_tree) {
            node.propagate_SceneTreeExited();
        }
    }

    // node public apis

    public add_Child(node: Node) {
        this.add_ChildInternal(node);
    }

    public remove_Child(node: Node) {
        this.remove_ChildInternal(node);
    }

    public has_Parent(): boolean {
        return this.parent !== undefined;
    }

    public has_Child(node: Node): boolean {
        return this.children.includes(node);
    }

    public get_ChildIndex(node: Node): number {
        return this.children.indexOf(node);
    }
}

export class Viewport extends Node {
}