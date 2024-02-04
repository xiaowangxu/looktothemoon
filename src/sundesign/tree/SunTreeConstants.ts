import { watch, type InjectionKey, type Ref, ref, customRef, toRef, reactive } from "vue";
import type { UID } from "../SunDesignConstants";
import { type TreeItem } from "./SunTreeItem.vue";

// export const SunTreeInjection = Symbol() as InjectionKey<{
//     activeOptions: Ref<UID[] | undefined>,
//     setOptionCache(uid: UID, tree_item: InstanceType<typeof SunTreeItem>): void,
//     deleteOptionCache(uid: UID): void,
// }>;

type TreeUIDMap<T extends TreeItem> = Map<UID, { parent: UID | undefined, option: T }>;

export class SunTreeOptionsRef<T extends TreeItem> {
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

    public clear() {
        this.options.value = [];
        this.uid_map.clear();
    }
}