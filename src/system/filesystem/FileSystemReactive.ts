import type { TreeItem } from "@/sundesign/tree/SunTreeItem.vue";
import { VFS, VirtualFileSystem, type VfsId, VfsMode } from "./VirtualFileSystem";
import { ref, type Ref, toRef } from "vue";
import { FileSystemPath, fspath } from "./FileSystemPath";
import type { BreadcrumbItem } from "@/sundesign/breadcrumb/SunBreadcrumb.vue";
import type { ColorScheme, Item } from "@/sundesign/SunDesignConstants";
import { SunTreeOptionsRef } from "../../sundesign/tree/SunTreeConstants";

export interface FileSystemRefItem {
    uid: VfsId,
    label?: string | undefined,
    colorScheme?: ColorScheme | undefined,
    icon?: string | undefined,
    active?: boolean | undefined,
    disabled?: boolean | undefined,
    checked?: boolean | undefined,
    leaf?: boolean | undefined,
    droppable?: boolean | undefined,
    subs: FileSystemRefItem[],
    parent: VfsId | undefined,
    hidden: boolean,
}

function get_Icon(name: string | undefined, is_file: boolean) {
    if (name === undefined) {
        if (is_file) return 'AlertTriangle';
        return 'FolderRoot';
    }
    const path = fspath(name);
    if (!path.is_valid) return 'AlertTriangle';
    if (!is_file) {
        switch (name) {
            case 'sys': return 'FolderLock';
            case 'user': return 'FolderHeart';
            default: return 'Folder';
        }
    }
    else {
        const ext = path.ext;
        let icon = 'File';
        switch (ext) {
            case '.txt': return 'FileText';
            case '.json': return 'FileJson';
            case '.lttm':
            case '.lttmbin': {
                icon = 'FileBox';
                break;
            }
        }
        const tags = path.tags;
        if (tags.length <= 0) return icon;
        const last = tags[tags.length - 1].toLowerCase();
        switch (last) {
            case 'geometry': return 'Box';
            case 'material': return 'Brush';
            case 'texture': return 'Image';
            case 'scene': return 'Globe2';
        }
        return icon;
    }
}

function is_Hidden(name: string | undefined) {
    if (name === undefined) {
        return false;
    }
    const path = fspath(name);
    if (!path.is_valid || !path.is_file) return false;
    if (path.tags.includes('ignore')) return true;
    return false;
}

export class FileSystemTreeOptionsRef {
    private readonly tree_data = new SunTreeOptionsRef<FileSystemRefItem>();
    public get root() { return this.tree_data.options };
    private readonly vfs: VirtualFileSystem;
    private readonly watchers_map: Map<VfsId, Set<Ref<FileSystemRefItem | undefined>>> = new Map();

    constructor(vfs: VirtualFileSystem) {
        this.vfs = vfs;
        this.vfs.signal_node_modify.connect(this._on_VfsNodeModify);
    }

    public watch(path: FileSystemPath) {
        const id = this.vfs.lookup(path);
        if (id.failed) return ref<FileSystemRefItem | undefined>();
        const _id = id.expect();
        const item_ref = this.trace_Node(_id);
        if (item_ref === undefined) return ref<FileSystemRefItem | undefined>();
        const watcher = ref(item_ref);
        if (this.watchers_map.has(_id)) {
            this.watchers_map.get(_id)!.add(watcher);
        }
        else {
            this.watchers_map.set(_id, new Set([watcher]));
        }
        return watcher;
    }

    public unwatch(ref: Ref<FileSystemRefItem | undefined>) {
        for (const [key, set] of [...this.watchers_map.entries()]) {
            if (set.has(ref)) {
                ref.value = undefined;
                set.delete(ref);
            }
            if (set.size <= 0) {
                this.watchers_map.delete(key);
            }
        }
    }

    private release_Watcher(id: VfsId) {
        if (!this.watchers_map.has(id)) return;
        const watchers = this.watchers_map.get(id)!;
        this.watchers_map.delete(id);
        for (const watcher of watchers) {
            watcher.value = undefined;
        }
    }

    public get_Breadcrumb(path: FileSystemPath | VfsId) {
        const id = this.vfs.lookup(path);
        if (id.failed) return [];
        const _id = id.expect();
        if (!this.has_Node(_id)) return [];
        const crumbs: BreadcrumbItem[] = [];
        let node = this.tree_data.get(_id);
        while (node !== undefined) {
            const parent = node.parent === undefined ? undefined : this.tree_data.get(node.parent);
            const subs = parent === undefined ? [] : parent.subs.filter(s => s.leaf === false).map(s => {
                return {
                    label: s.label,
                    uid: s.uid,
                    icon: s.icon,
                } as Item
            });
            crumbs.unshift({
                item: {
                    label: node.label,
                    iconOnly: node.label === undefined,
                    uid: node.uid,
                    icon: node.icon,
                },
                siblings: subs,
            });
            node = parent;
        }
        return crumbs;
    }

    private has_Node(id: VfsId) {
        return this.tree_data.has(id);
    }

    private create_NodeRef(id: VfsId, parent: VfsId | undefined, is_file: boolean, name: string | undefined, hidden: boolean): FileSystemRefItem {
        return {
            parent: parent,
            label: name,
            uid: id,
            leaf: is_file,
            disabled: hidden || is_Hidden(name),
            icon: get_Icon(name, is_file),
            hidden: hidden,
            subs: [],
        };
    }

    private trace_Node(id: VfsId) {
        if (this.has_Node(id)) return this.tree_data.get(id)!;
        const query = this.vfs.query(id);
        if (query.failed) return undefined;
        const { name, id: _id, parent, type, mode } = query.expect();
        const ref_item = this.create_NodeRef(_id, parent, type === 'file', name, (mode & VfsMode.Hidden) !== 0);
        this.tree_data.push(parent, ref_item);
        const subs = this.vfs.list(_id);
        if (subs.succeed) {
            for (const sub of subs.expect()) {
                this.trace_Node(sub);
            }
        }
        return ref_item;
    }

    private rename_Node(id: VfsId) {
        if (!this.has_Node(id)) return;
        const query = this.vfs.query(id);
        if (query.failed) return undefined;
        const { name, id: _id, type, mode } = query.expect();
        const ref_item = this.tree_data.get(id)!;
        const is_file = type === 'file';
        ref_item.label = name;
        ref_item.uid = id;
        ref_item.leaf = is_file;
        ref_item.disabled = (mode & VfsMode.Hidden) !== 0 || is_Hidden(name);
        ref_item.icon = get_Icon(name, is_file);
    }

    private _release_Watcher(item: FileSystemRefItem) {
        this.release_Watcher(item.uid);
        for (const sub of item.subs) {
            this._release_Watcher(sub);
        }
    }
    private delete_Node(id: VfsId) {
        if (!this.has_Node(id)) return;
        const ref_item = this.tree_data.get(id)!;
        this.tree_data.delete(id);
        this._release_Watcher(ref_item);
    }

    private readonly _on_VfsNodeModify = this.on_VfsNodeModify.bind(this);
    private on_VfsNodeModify(action: 'attach' | 'detach' | 'rename', id: VfsId) {
        switch (action) {
            case 'attach': {
                this.trace_Node(id);
                break;
            }
            case 'detach': {
                this.delete_Node(id);
                break;
            }
            case 'rename': {
                this.rename_Node(id);
                break;
            }
        }
    }

    public dispose() {
        this.root.value = [];
        this.tree_data.clear();
        for (const set of this.watchers_map.values()) {
            for (const ref of set) {
                ref.value = undefined;
            }
        }
        this.watchers_map.clear();
    }
}

export const VFSTreeOptionsRef = new FileSystemTreeOptionsRef(VFS);