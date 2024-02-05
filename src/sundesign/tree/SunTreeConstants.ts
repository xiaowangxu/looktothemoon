import { type InjectionKey, type Ref, ref, toRef, reactive, type ComponentInternalInstance, computed } from "vue";
import type { Size, UID, PopupOpenMode, DragData } from "../SunDesignConstants";
import { type TreeItem } from "./SunTreeItem.vue";
import type { SunContextMenuEvent } from "../contextmenu/SunContextMenu";

export interface SunTreeItemDragData extends DragData {
    type: 'SunTreeItemDrag',
    tree: UID | undefined,
    uid: UID | UID[],
}

export enum SunTreeDroppable {
    None = 0,
    Above = 1,
    In = 2,
    Below = 4,
    Parent = 8,
    All = 0b1111,
}

export const SunTreeInjection = Symbol() as InjectionKey<{
    treeUID: Ref<UID | undefined>,
    setUIDComponentCache?: (uid: UID, component: ComponentInternalInstance) => void;
    deleteUIDComponentCache?: (uid: UID, component: ComponentInternalInstance) => boolean;
    setUIDFoldedCache?: (uid: UID, folded: boolean | undefined) => void;
    getUIDFoldedCache?: (uid: UID) => boolean,
    canDrop?: (drag_uid: UID | UID[], drop_uid: UID) => SunTreeDroppable,
    onDragStart?: (uid: UID, evt: DragEvent) => void,
    isActive: (uid: UID) => boolean,
    onClick: (data: UID, evt: Event) => void,
    onContextMenu: (data: UID, evt: SunContextMenuEvent) => void,
    onEdit: (data: UID, label: string) => void,
    onDrop: (drag_uid: UID | UID[], drop_uid: UID, drop_mode: SunTreeDroppable) => void,
    folderLine: Ref<boolean>,
    size: Ref<Size>,
    mode: Ref<PopupOpenMode>,
    draggable: Ref<boolean>,
    unfoldDelay: Ref<number>,
    clickFolding: Ref<boolean>,
    filterSort: Ref<((options: TreeItem[]) => TreeItem[]) | undefined>,
}>;

type TreeUIDMap<T extends TreeItem> = Map<UID, { parent: UID | undefined, option: T }>;

export interface SunTreeOptions<T extends TreeItem = TreeItem> {
    get options(): Ref<T[]>;
    has(uid: UID): boolean,
    push(parent: UID | undefined, option: T): void,
    delete(uid: UID): void,
    get(uid: UID): T | undefined,
    set<TT extends T, K extends keyof Omit<TT, 'subs'>>(uid: UID, key: K, val: TT[K]): void,
    abspath(uid: UID): UID[],
    parent(uid: UID): UID | undefined,
    ancestor(child: UID, ancestor: UID): boolean,
    clear(): void,
}

export class SunTreeOptionsRef<T extends TreeItem = TreeItem> implements SunTreeOptions<T> {
    public readonly options: Ref<T[]> = ref([]);
    public readonly uid_map: TreeUIDMap<T> = new Map();

    constructor(options?: T[]) {
        if (options !== undefined) {
            for (const option of [...options]) {
                this.track(undefined, option);
            }
        }
    }

    public has(uid: UID) {
        return this.uid_map.has(uid);
    }

    private track(parent: UID | undefined, option: T, append_root: boolean = true) {
        const uid = option.uid;
        if (this.has(uid)) return;
        const ref = reactive(option);
        if (parent === undefined) {
            this.uid_map.set(uid, { parent: undefined, option: ref as T });
            if (append_root) {
                this.options.value.push(ref as T);
            }
        }
        else if (this.has(parent)) {
            if (append_root) {
                const _parent = toRef(this.uid_map.get(parent)!);
                if (_parent.value.option.subs === undefined) {
                    _parent.value.option.subs = [ref];

                }
                else {
                    _parent.value.option.subs.push(ref);
                }
            }
            this.uid_map.set(uid, { parent: parent, option: ref as T });
        }
        else return;
        if (option.subs !== undefined) {
            for (const sub of [...option.subs]) {
                this.track(uid, sub as T, false);
            }
        }
    }

    public push(parent: UID | undefined, option: T) {
        if (parent !== undefined && !this.has(parent)) return;
        this.track(parent, option);
    }

    private _delete(uid: UID, check_parent: boolean = true) {
        if (!this.has(uid)) return;
        const { parent, option } = this.uid_map.get(uid)!;
        this.uid_map.delete(uid);
        if (check_parent) {
            if (parent === undefined) {
                const index = this.options.value.findIndex(o => o.uid === uid);
                if (index >= 0) {
                    this.options.value.splice(index, 1);
                }
            }
            else if (this.has(parent)) {
                const _parent = this.uid_map.get(parent)!.option;
                if (_parent.subs !== undefined) {
                    const index = _parent.subs.findIndex(o => o.uid === uid);
                    if (index >= 0) {
                        _parent.subs.splice(index, 1);
                    }
                }
            }
        }
        if (option.subs !== undefined) {
            for (const sub of option.subs) {
                this._delete(sub.uid, false);
            }
        }
    }

    public delete(uid: UID) {
        return this._delete(uid);
    }

    public get(uid: UID) {
        return this.uid_map.get(uid)?.option;
    }

    public set<TT extends T, K extends keyof Omit<TT, 'subs'>>(uid: UID, key: K, val: TT[K]) {
        if (!this.has(uid)) return;
        if (key === 'uid') {
            if (this.has(val as UID)) throw new Error("<TreeOptionsRef> set@uid: cannot set option's uid to an existed one");
            const map_option = this.uid_map.get(uid)!;
            (map_option.option as TT)[key] = val;
            this.uid_map.delete(uid);
            this.uid_map.set(val as UID, map_option);
            if (map_option.option.subs !== undefined) {
                for (const sub of map_option.option.subs) {
                    this.uid_map.get(sub.uid)!.parent = val as UID;
                }
            }
        }
        else {
            (this.uid_map.get(uid)!.option as TT)[key] = val;
        }
    }

    public parent(uid: UID): UID | undefined {
        return this.uid_map.get(uid)?.parent;
    }

    public ancestor(child: UID, ancestor: UID): boolean {
        if (!this.has(child) || !this.has(ancestor)) return false;
        if (child === ancestor) return true;
        let { parent } = this.uid_map.get(child)!;
        while (parent !== undefined) {
            if (parent === ancestor) return true;
            parent = this.uid_map.get(parent)!.parent;
        }
        return false;
    }

    public abspath(uid: UID) {
        if (!this.has(uid)) return [];
        const path = [uid];
        let { parent } = this.uid_map.get(uid)!;
        while (parent !== undefined) {
            path.unshift(parent);
            parent = this.uid_map.get(parent)!.parent;
        }
        return path;
    }

    public clear() {
        this.options.value = [];
        this.uid_map.clear();
    }
}

export class SunSubTreeOptionsRef<T extends TreeItem = TreeItem> implements SunTreeOptions<T> {
    private readonly tree: SunTreeOptionsRef<T>;

    public readonly options: Ref<T[]> = ref([]);
    private root_uid: UID | undefined;
    private readonly contain_root: boolean;

    constructor(tree: SunTreeOptionsRef<T>, uid: UID | undefined, contain_root: boolean = true) {
        this.tree = tree;
        this.contain_root = contain_root;
        if (uid !== undefined) {
            const option = this.tree.get(uid);
            if (option !== undefined) {
                this.root_uid = uid;
                this.options = contain_root ? (ref([option]) as Ref<T[]>) : computed(() => option.subs as T[] ?? []);
            }
        }
    }

    public has(uid: UID) {
        if (!this.tree.has(uid) || this.root_uid === undefined) return false;
        return this.tree.ancestor(uid, this.root_uid);
    }

    public push(parent: UID | undefined, option: T) {
        if (parent === undefined || !this.has(parent)) return;
        return this.tree.push(parent, option);
    }

    public delete(uid: UID) {
        if (!this.has(uid)) return;
        return this.tree.delete(uid);
    }

    public get(uid: UID) {
        if (!this.has(uid)) return undefined;
        return this.tree.get(uid);
    }

    public set<TT extends T, K extends keyof Omit<TT, 'subs'>>(uid: UID, key: K, val: TT[K]) {
        if (!this.has(uid)) return;
        return this.tree.set(uid, key, val);
    }

    public parent(uid: UID): UID | undefined {
        if (!this.has(uid)) return;
        return this.tree.parent(uid);
    }

    public ancestor(child: UID, ancestor: UID): boolean {
        if (!this.has(child) || !this.has(ancestor)) return false;
        return this.tree.ancestor(child, ancestor);
    }

    public abspath(uid: UID) {
        if (this.root_uid === undefined || !this.has(uid)) return [];
        const path = [uid];
        let parent: UID | undefined = this.tree.parent(uid)!;
        while (parent !== undefined) {
            path.unshift(parent);
            if (parent === this.root_uid) break;
            parent = this.tree.parent(parent);
        }
        if (!this.contain_root && path[0] === this.root_uid) path.shift();
        return path;
    }

    public clear() {
        this.options.value = [];
        this.root_uid = undefined;
    }
}