import { Result } from "../utils/Result";
import { type FileSystemPath } from "./FileSystemPath";
import { save_FileSystem, type FileSystemDataInstance, load_FileSystem } from './fs_saver_loader/FileSystemSaverLoader.mjs';

// #region Const

export type VfsId = number;

export enum VfsMode {
    None = 0,
    Hidden = 1 << 0,
    Read = 1 << 1,
    Write = 1 << 2,
    Execute = 1 << 3,
}

export enum VfsOperationResult {
    Ok,
    SrcInvalid,
    DstInvalid,
    InputsInvalid,
    InUsageInvalid,
    AuthInvalid,
    EmptyInvalid,
    NotFound,
}

// #endregion

export class VirtualFileSystem {
    public static RootVfsId: VfsId = 0;

    private readonly nodes: Map<VfsId, VfsNode> = new Map();
    private readonly orphan_nodes: Set<VfsId> = new Set();
    private readonly blocks: Map<VfsId, VfsBlock> = new Map();
    private readonly handlers: Map<VfsId, VfsHandler> = new Map();

    private _vfs_id = 1;
    private get vfs_id() { return this._vfs_id++; }

    constructor() {
        const dir = new VfsDirectoryNode(VirtualFileSystem.RootVfsId, this);
        this.add_Node(VirtualFileSystem.RootVfsId, dir);
    }

    // #region Node Handler Block

    private is_OrphanNode(id: VfsId) {
        return id !== VirtualFileSystem.RootVfsId && this.orphan_nodes.has(id);
    }

    // #region add / remove / get Node Handler Block

    private add_Node(id: VfsId, node: VfsNode) {
        this.nodes.set(id, node);
        if (id !== VirtualFileSystem.RootVfsId) this.orphan_nodes.add(id);
    }

    private remove_Node(id: VfsId) {
        this.nodes.delete(id);
        if (id !== VirtualFileSystem.RootVfsId) this.orphan_nodes.delete(id);
    }

    private get_Node(id: VfsId) {
        return this.nodes.get(id);
    }

    private add_Handler(id: VfsId, handler: VfsHandler) {
        this.handlers.set(id, handler);
    }

    private remove_Handler(id: VfsId) {
        this.handlers.delete(id);
    }

    private get_Handler(id: VfsId) {
        return this.handlers.get(id);
    }

    private add_Block(id: VfsId, block: VfsBlock) {
        this.blocks.set(id, block);
    }

    private remove_Block(id: VfsId) {
        this.blocks.delete(id);
    }

    private get_Block(id: VfsId) {
        return this.blocks.get(id);
    }

    // #endregion

    private attach_NodeInternal(node: VfsId) {
        const _node = this.get_Node(node);
        if (_node === undefined) return;
        if (_node instanceof VfsDirectoryNode) {
            for (const i of _node.subs) {
                this.attach_NodeInternal(i);
            }
        }
        this.orphan_nodes.delete(_node.id);
    }

    private attach_Node(node: VfsId, parent: VfsId = VirtualFileSystem.RootVfsId) {
        const _node = this.get_Node(node);
        if (_node === undefined) return VfsOperationResult.SrcInvalid;
        if (!this.is_OrphanNode(_node.id)) return VfsOperationResult.SrcInvalid;
        const _parent = this.get_Node(parent);
        if (_parent === undefined || !(_parent instanceof VfsDirectoryNode)) return VfsOperationResult.DstInvalid;
        if (this.is_OrphanNode(_parent.id)) return VfsOperationResult.DstInvalid;
        _node.parent = _parent.id;
        _parent.subs.add(_node.id);
        if (!this.is_OrphanNode(_parent.id)) this.attach_NodeInternal(_node.id);
        return VfsOperationResult.Ok;
    }

    private detach_NodeInternal(node: VfsId) {
        const _node = this.get_Node(node);
        if (_node === undefined) return;
        if (_node instanceof VfsDirectoryNode) {
            for (const i of _node.subs) {
                this.detach_NodeInternal(i);
            }
        }
        this.orphan_nodes.add(_node.id);
    }

    private detach_Node(node: VfsId) {
        const _node = this.get_Node(node);
        if (_node === undefined) return VfsOperationResult.SrcInvalid;
        if (this.is_OrphanNode(_node.id)) return VfsOperationResult.SrcInvalid;
        const _parent = this.get_Node(_node.parent!);
        if (_parent === undefined || !(_parent instanceof VfsDirectoryNode)) return VfsOperationResult.DstInvalid;
        _node.parent = undefined;
        _parent.subs.delete(_node.id);
        this.detach_NodeInternal(_node.id);
        return VfsOperationResult.Ok;
    }

    private delete_NodeInternal(node: VfsId) {
        const _node = this.get_Node(node);
        if (_node === undefined) return;
        if (_node instanceof VfsDirectoryNode) {
            for (const i of _node.subs) {
                this.delete_NodeInternal(i);
            }
        }
        else if (_node instanceof VfsFileNode) {
            if (_node.handler !== undefined) {
                this.close_Handler(_node.handler);
            }
        }
        this.remove_Node(_node.id);
    }

    private delete_Node(node: VfsId) {
        const _node = this.get_Node(node);
        if (_node === undefined) return VfsOperationResult.SrcInvalid;
        if (!this.is_OrphanNode(_node.id)) return VfsOperationResult.SrcInvalid;
        this.delete_NodeInternal(_node.id);
        return VfsOperationResult.Ok;
    }

    private find_Node(parent: VfsId, name: string): Result<VfsId, VfsOperationResult> {
        const _parent = this.get_Node(parent);
        if (_parent === undefined || !(_parent instanceof VfsDirectoryNode)) return Result.Error(VfsOperationResult.SrcInvalid);
        if (this.is_OrphanNode(_parent.id)) return Result.Error(VfsOperationResult.SrcInvalid);
        for (const i of _parent.subs) {
            const _node = this.get_Node(i);
            if (_node !== undefined && _node.name === name) return Result.Ok(_node.id);
        }
        return Result.Error(VfsOperationResult.NotFound);
    }

    private set_NodeName(node: VfsId, name: string) {
        const _node = this.get_Node(node);
        if (_node === undefined) return VfsOperationResult.SrcInvalid;
        _node.name = name;
        return VfsOperationResult.Ok;
    }

    private set_NodeMode(node: VfsId, mode: VfsMode) {
        const _node = this.get_Node(node);
        if (_node === undefined) return VfsOperationResult.SrcInvalid;
        _node.mode = mode;
        return VfsOperationResult.Ok;
    }

    private create_Handler(block: VfsId, mode?: VfsMode): Result<VfsId, VfsOperationResult> {
        const _block = this.get_Block(block);
        if (_block === undefined) return Result.Error(VfsOperationResult.SrcInvalid);
        const handler = new VfsHandler(this.vfs_id, this, _block.id, mode);
        _block.handlers.add(handler.id);
        this.add_Handler(handler.id, handler);
        return Result.Ok(handler.id);
    }

    private redirect_Handler(handler: VfsId, block: VfsId) {
        const _handler = this.get_Handler(handler);
        if (_handler === undefined) return VfsOperationResult.InputsInvalid;
        const _old_block = this.get_Block(_handler.block);
        if (_old_block === undefined) return VfsOperationResult.SrcInvalid;
        const _block = this.get_Block(block);
        if (_block === undefined) return VfsOperationResult.SrcInvalid;
        _old_block.handlers.delete(_handler.id);
        _block.handlers.add(_handler.id);
        this.delete_Block(_old_block.id);
        _handler.block = _block.id;
        return VfsOperationResult.Ok;
    }

    private close_Handler(handler: VfsId): VfsOperationResult {
        const _handler = this.get_Handler(handler);
        if (_handler === undefined) return VfsOperationResult.InputsInvalid;
        const _block = this.get_Block(_handler.block);
        if (_block === undefined) return VfsOperationResult.SrcInvalid;
        _block.handlers.delete(_handler.id);
        this.remove_Handler(_handler.id);
        this.delete_Block(_block.id);
        return VfsOperationResult.Ok;
    }

    private get_HandlerBuffer(handler: VfsId): Result<ArrayBuffer | undefined, VfsOperationResult> {
        const _handler = this.get_Handler(handler);
        if (_handler === undefined) return Result.Error(VfsOperationResult.InputsInvalid);
        if (_handler.write_buffer !== undefined) return Result.Ok(_handler.write_buffer)
        const _block = this.get_Block(_handler.block);
        if (_block === undefined) return Result.Error(VfsOperationResult.SrcInvalid);
        return Result.Ok(_block.buffer);
    }

    private create_Block() {
        const block = new VfsBlock(this.vfs_id, this);
        this.add_Block(block.id, block);
        return block.id;
    }

    private set_BlockBuffer(block: VfsId, buffer: ArrayBuffer | undefined) {
        const _block = this.get_Block(block);
        if (_block === undefined) return VfsOperationResult.InputsInvalid;
        _block.buffer = buffer === undefined ? undefined : buffer.slice(0);
        return VfsOperationResult.Ok;
    }

    private delete_Block(block: VfsId) {
        const _block = this.get_Block(block);
        if (_block === undefined) return VfsOperationResult.InputsInvalid;
        if (_block.handlers.size > 0) return VfsOperationResult.InUsageInvalid;
        this.remove_Block(_block.id);
        return VfsOperationResult.Ok;
    }

    // #endregion

    // #region Directory

    private create_Directory(name?: string, mode?: VfsMode) {
        const dir = new VfsDirectoryNode(this.vfs_id, this);
        this.add_Node(dir.id, dir);
        if (name !== undefined) this.set_NodeName(dir.id, name);
        if (mode !== undefined) this.set_NodeMode(dir.id, mode);
        return dir.id;
    }

    // #endregion

    // #region File

    private create_File(name?: string, mode?: VfsMode) {
        const file = new VfsFileNode(this.vfs_id, this);
        this.add_Node(file.id, file);
        if (name !== undefined) this.set_NodeName(file.id, name);
        if (mode !== undefined) this.set_NodeMode(file.id, mode);
        return file.id;
    }

    private link_Block(file: VfsId, block: VfsId) {
        const _file = this.get_Node(file);
        if (_file === undefined || !(_file instanceof VfsFileNode) || _file.handler !== undefined || this.is_OrphanNode(_file.id)) return VfsOperationResult.SrcInvalid;
        const _block = this.get_Block(block);
        if (_block === undefined) return VfsOperationResult.InputsInvalid;
        const hnd = this.create_Handler(_block.id);
        if (hnd.failed) return hnd.expect_Error();
        _file.handler = hnd.expect();
        return VfsOperationResult.Ok;
    }

    private unlink_Block(file: VfsId) {
        const _file = this.get_Node(file);
        if (_file === undefined || !(_file instanceof VfsFileNode) || this.is_OrphanNode(_file.id)) return VfsOperationResult.SrcInvalid;
        if (_file.handler === undefined) return VfsOperationResult.Ok;
        const hnd = _file.handler;
        _file.handler = undefined;
        return this.close_Handler(hnd);
    }

    private open_File(node: VfsId, mode?: VfsMode, create_block: boolean = false): Result<VfsId, VfsOperationResult> {
        const _node = this.get_Node(node);
        if (_node === undefined || !(_node instanceof VfsFileNode) || this.is_OrphanNode(_node.id)) return Result.Error(VfsOperationResult.SrcInvalid);
        if (_node.handler === undefined && !create_block) return Result.Error(VfsOperationResult.SrcInvalid);
        if (_node.handler === undefined) {
            const __block = this.create_Block();
            if (this.link_Block(_node.id, __block) !== VfsOperationResult.Ok) return Result.Error(VfsOperationResult.SrcInvalid);
        }
        if (_node.handler === undefined) return Result.Error(VfsOperationResult.SrcInvalid);
        const _handler = this.get_Handler(_node.handler);
        if (_handler === undefined) return Result.Error(VfsOperationResult.SrcInvalid);
        const _block = this.get_Block(_handler.block);
        const _mode = mode !== undefined ? _node.mode & mode : _node.mode;
        if (_block === undefined) return Result.Error(VfsOperationResult.SrcInvalid);
        return this.create_Handler(_block.id, _mode);
    }

    // #endregion

    // api

    public lookup(path: FileSystemPath): Result<VfsId, VfsOperationResult> {
        if (!path.is_valid || !path.is_absolute) return Result.Error(VfsOperationResult.InputsInvalid);
        let root = VirtualFileSystem.RootVfsId;
        for (const { item, is_file } of path.get_IgnoredRootIter()) {
            if (is_file) {
                const file = this.find_Node(root, item);
                if (file.failed) return file;
                root = file.expect();
            }
            else {
                const folder = this.find_Node(root, item);
                if (folder.failed) return folder;
                root = folder.expect();
            }
        }
        return Result.Ok(root);
    }

    public touch(path: FileSystemPath, mode?: VfsMode): Result<VfsId, VfsOperationResult> {
        if (!path.is_valid || !path.is_absolute) return Result.Error(VfsOperationResult.SrcInvalid);
        let root = VirtualFileSystem.RootVfsId;
        for (const { item, is_file } of path.get_IgnoredRootIter()) {
            if (is_file) {
                const file = this.find_Node(root, item);
                if (file.failed) {
                    const _file = this.create_File(item, mode);
                    this.attach_Node(_file, root);
                    root = _file;
                }
                else {
                    root = file.expect();
                }
            }
            else {
                const folder = this.find_Node(root, item);
                if (folder.failed) {
                    const _folder = this.create_Directory(item, mode);
                    this.attach_Node(_folder, root);
                    root = _folder;
                }
                else {
                    root = folder.expect();
                }
            }
        }
        return Result.Ok(root);
    }

    public remove(path: FileSystemPath): VfsOperationResult {
        const node = this.lookup(path);
        if (node.failed) return node.expect_Error();
        const _node = node.expect();
        let err;
        if ((err = this.detach_Node(_node)) !== VfsOperationResult.Ok) return err;
        if ((err = this.delete_Node(_node)) !== VfsOperationResult.Ok) return err;
        return VfsOperationResult.Ok;
    }

    public open(path: FileSystemPath, mode: VfsMode, create_file: boolean = true) {
        const node = create_file ? this.touch(path, mode) : this.lookup(path);
        if (node.failed) return node;
        const _node = node.expect();
        return this.open_File(_node, mode, true);
    }

    public close(handler: VfsId) {
        return this.close_Handler(handler);
    }

    public rename(path: FileSystemPath, name: string, unique: boolean = true) {
        const node = this.lookup(path);
        if (node.failed) return node.expect_Error();
        const _node = node.expect();
        if (unique) {
            // check name's exist
            const __node = this.get_Node(_node);
            if (__node === undefined || __node.parent === undefined) return VfsOperationResult.SrcInvalid;
            const res = this.find_Node(__node.parent, name);
            if (res.failed) {
                if (res.expect_Error() !== VfsOperationResult.NotFound) return res.expect_Error();
            }
            else {
                return VfsOperationResult.InputsInvalid;
            }
        }
        // rename
        return this.set_NodeName(_node, name);
    }

    public flush(path: FileSystemPath, handler: VfsId, create_file: boolean = false, create_mode?: VfsMode) {
        const _handler = this.get_Handler(handler);
        if (_handler === undefined) return VfsOperationResult.InputsInvalid;
        if (_handler.write_buffer === undefined) return VfsOperationResult.Ok;
        const node = create_file ? this.touch(path, create_mode) : this.lookup(path);
        if (node.failed) return node.expect_Error();
        const _node = node.expect();
        const _block = this.create_Block();
        if (this.set_BlockBuffer(_block, _handler.write_buffer) !== VfsOperationResult.Ok) return VfsOperationResult.InputsInvalid;
        if (this.unlink_Block(_node) !== VfsOperationResult.Ok) return VfsOperationResult.SrcInvalid;
        if (this.link_Block(_node, _block) !== VfsOperationResult.Ok) return VfsOperationResult.SrcInvalid;
        if (this.redirect_Handler(_handler.id, _block) !== VfsOperationResult.Ok) return VfsOperationResult.InputsInvalid;
        return VfsOperationResult.Ok;
    }

    // public seek(handler: VfsId, offset: number, back: boolean = false): Result<number, VfsOperationResult> {
    //     const _handler = this.get_Handler(handler);
    //     if (_handler === undefined) return Result.Error(VfsOperationResult.InputsInvalid);
    //     const buffer = this.get_HandlerBuffer(handler);
    //     if (buffer.failed) return Result.Error(buffer.expect_Error());
    //     const _buffer = buffer.expect();
    //     if (_buffer === undefined) {
    //         _handler.buffer_pointer = 0;
    //         return Result.Error(VfsOperationResult.EmptyInvalid);
    //     }
    //     else {
    //         const byte_length = _buffer.byteLength;
    //         const _offset = Math.min(byte_length - 1, Math.max(0, !back ? offset : (byte_length - 1 - offset)));
    //         _handler.buffer_pointer = _offset;
    //         return Result.Ok(_offset);
    //     }
    // }

    public read(handler: VfsId): Result<ArrayBuffer | undefined, VfsOperationResult> {
        const buffer = this.get_HandlerBuffer(handler);
        if (buffer.failed) return Result.Error(buffer.expect_Error());
        const _buffer = buffer.expect();
        return Result.Ok(_buffer === undefined ? undefined : _buffer.slice(0));
    }

    public write(handler: VfsId, buffer: ArrayBuffer) {
        const _handler = this.get_Handler(handler);
        if (_handler === undefined) return VfsOperationResult.InputsInvalid;
        _handler.write_buffer = buffer.slice(0);
        return VfsOperationResult.Ok;
    }

    // system

    public load(data: ArrayBuffer, root_path: FileSystemPath) {
        const root = this.lookup(root_path);
        if (root.failed) throw new Error('<VirtualFileSystem> load: root path invalid');
        const _root = root.expect();

        const nodes_data = load_FileSystem(data);
        if (nodes_data === undefined) throw new Error('<VirtualFileSystem> load: data invalid');
        const nodes = [];
        const file_block_map: Map<VfsId, VfsId> = new Map();
        for (const { name, is_file, buffer } of nodes_data) {
            const node = is_file ? this.create_File(name) : this.create_Directory(name);
            nodes.push(node);
            if (is_file && buffer !== undefined) {
                const block = this.create_Block();
                this.set_BlockBuffer(block, buffer);
                file_block_map.set(node, block);
            }
        }
        // build structural
        let i = 0;
        for (const { is_file, is_root, subs, name } of nodes_data) {
            const node = nodes[i];
            if (is_root) {
                this.attach_Node(node, _root);
            }
            if (!is_file && subs !== undefined) {
                for (const sub of subs) {
                    this.attach_Node(nodes[sub], node);
                }
            }
            i++;
        }
        // load data
        for (const [file, block] of file_block_map) {
            this.link_Block(file, block);
        }
    }

    // debug

    public print(node: VfsId = VirtualFileSystem.RootVfsId, line: string = '') {
        const _node = this.get_Node(node);
        if (_node === undefined) return;
        if (_node instanceof VfsFileNode) {
            console.log(`${line}[${_node.name ?? '/'}]`, _node.handler ? `-> blockhnd(${_node.handler})` : 'empty');
            return;
        }
        else if (_node instanceof VfsDirectoryNode) {
            console.log(`${line}+ ${_node.name ?? '/'}`);
            for (const i of _node.subs) {
                this.print(i, `  ${line}`);
            }
        }
        if (node === VirtualFileSystem.RootVfsId) {
            console.groupCollapsed('');
            console.group('orphan *', this.orphan_nodes.size);
            for (const i of this.orphan_nodes) {
                this.print(i);
            }
            console.groupEnd();
            console.group('handler *', this.handlers.size);
            for (const [i, handler] of this.handlers) {
                console.log('handler', handler.id, '->', handler.block);
            }
            console.groupEnd();
            console.group('block *', this.blocks.size);
            for (const [i, block] of this.blocks) {
                console.log('block', block.id, [...block.handlers]);
            }
            console.groupEnd();
            console.groupEnd();
        }
    }
}

// #region VfsNode 

abstract class VfsNode {
    public id: VfsId;
    public name: string | undefined;
    public readonly fs: VirtualFileSystem;

    public parent: VfsId | undefined;

    public mode: VfsMode = VfsMode.None;

    constructor(id: VfsId, fs: VirtualFileSystem) {
        this.id = id;
        this.fs = fs;
    }
}

class VfsDirectoryNode extends VfsNode {
    public readonly subs: Set<VfsId> = new Set();
}

class VfsFileNode extends VfsNode {
    public handler: VfsId | undefined;
}

class VfsBlock {
    public id: VfsId;
    public readonly fs: VirtualFileSystem;

    public readonly handlers: Set<VfsId> = new Set();

    public buffer: ArrayBuffer | undefined = undefined;

    constructor(id: VfsId, fs: VirtualFileSystem) {
        this.id = id;
        this.fs = fs;
    }
}

class VfsHandler {
    public id: VfsId;
    public readonly fs: VirtualFileSystem;

    public block: VfsId;

    public readonly mode: VfsMode;

    public write_buffer: ArrayBuffer | undefined = undefined;

    constructor(id: VfsId, fs: VirtualFileSystem, node: VfsId, mode?: VfsMode) {
        this.id = id;
        this.fs = fs;
        this.block = node;
        this.mode = mode ?? VfsMode.None;
    }
}

// #endregion

export const VFS = new VirtualFileSystem();