import { Result } from "../utils/Result";

type VfsId = number;
type UserId = number;
const SuperUser: UserId = 0;
const RootVfsId: VfsId = 0;

export enum VfsMode {
    None = 0,
    Read = 1,
    Write = 1 << 1,
}

export enum VfsOperationResult {
    Ok,
    SrcInvalid,
    DstInvalid,
    InputsInvalid,
    InUsageInvalid,
    AuthInvalid,
}

export class VirtualFileSystem {
    private readonly nodes: Map<VfsId, VfsNode> = new Map();
    private readonly orphan_nodes: Set<VfsId> = new Set();
    private readonly blocks: Map<VfsId, VfsBlock> = new Map();
    private readonly handlers: Map<VfsId, VfsHandler> = new Map();

    private _vfs_id = 1;
    private get vfs_id() { return this._vfs_id++; }

    constructor() {
        const dir = new VfsDirectoryNode(RootVfsId, this);
        this.add_Node(RootVfsId, dir);
    }

    // #region Node Handler Block

    private is_OrphanNode(id: VfsId) {
        return id !== RootVfsId && this.orphan_nodes.has(id);
    }

    // #region add / remove / get Node Handler Block

    private add_Node(id: VfsId, node: VfsNode) {
        this.nodes.set(id, node);
        if (id !== RootVfsId) this.orphan_nodes.add(id);
    }

    private remove_Node(id: VfsId) {
        this.nodes.delete(id);
        if (id !== RootVfsId) this.orphan_nodes.delete(id);
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

    public attach_NodeInternal(node: VfsId) {
        const _node = this.get_Node(node);
        if (_node === undefined) return;
        if (_node instanceof VfsDirectoryNode) {
            for (const i of _node.subs) {
                this.attach_NodeInternal(i);
            }
        }
        this.orphan_nodes.delete(_node.id);
    }

    public attach_Node(node: VfsId, parent: VfsId = RootVfsId) {
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

    public detach_NodeInternal(node: VfsId) {
        const _node = this.get_Node(node);
        if (_node === undefined) return;
        if (_node instanceof VfsDirectoryNode) {
            for (const i of _node.subs) {
                this.detach_NodeInternal(i);
            }
        }
        this.orphan_nodes.add(_node.id);
    }

    public detach_Node(node: VfsId) {
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

    public delete_Node(node: VfsId) {
        const _node = this.get_Node(node);
        if (_node === undefined) return VfsOperationResult.SrcInvalid;
        if (!this.is_OrphanNode(_node.id)) return VfsOperationResult.SrcInvalid;
        this.delete_NodeInternal(_node.id);
        return VfsOperationResult.Ok;
    }

    public set_NodeName(node: VfsId, name: string) {
        const _node = this.get_Node(node);
        if (_node === undefined) return VfsOperationResult.SrcInvalid;
        if (this.is_OrphanNode(_node.id)) return VfsOperationResult.SrcInvalid;
        _node.name = name;
        return VfsOperationResult.Ok;
    }

    public create_Handler(block: VfsId): Result<VfsId, VfsOperationResult> {
        const _block = this.get_Block(block);
        if (_block === undefined) return Result.Error(VfsOperationResult.SrcInvalid);
        const handler = new VfsHandler(this.vfs_id, this, _block.id);
        _block.handlers.add(handler.id);
        this.add_Handler(handler.id, handler);
        return Result.Ok(handler.id);
    }

    public close_Handler(handler: VfsId): VfsOperationResult {
        const _handler = this.get_Handler(handler);
        if (_handler === undefined) return VfsOperationResult.InputsInvalid;
        const _block = this.get_Block(_handler.block);
        if (_block === undefined) return VfsOperationResult.SrcInvalid;
        _block.handlers.delete(_handler.id);
        this.remove_Handler(_handler.id);
        this.delete_Block(_block.id);
        return VfsOperationResult.Ok;
    }

    public create_Block() {
        const block = new VfsBlock(this.vfs_id, this);
        this.add_Block(block.id, block);
        return block.id;
    }

    public delete_Block(block: VfsId) {
        const _block = this.get_Block(block);
        if (_block === undefined) return VfsOperationResult.InputsInvalid;
        if (_block.handlers.size > 0) return VfsOperationResult.InUsageInvalid;
        this.remove_Block(_block.id);
        return VfsOperationResult.Ok;
    }

    // #endregion

    // #region Directory

    public create_Directory() {
        const dir = new VfsDirectoryNode(this.vfs_id, this);
        this.add_Node(dir.id, dir);
        return dir.id;
    }

    // #endregion

    // #region File

    public create_File() {
        const file = new VfsFileNode(this.vfs_id, this);
        this.add_Node(file.id, file);
        return file.id;
    }

    public link_Block(file: VfsId, block: VfsId) {
        const _file = this.get_Node(file);
        if (_file === undefined || !(_file instanceof VfsFileNode) || _file.handler !== undefined || this.is_OrphanNode(_file.id)) return VfsOperationResult.SrcInvalid;
        const _block = this.get_Block(block);
        if (_block === undefined) return VfsOperationResult.InputsInvalid;
        const hnd = this.create_Handler(_block.id);
        if (hnd.failed) return hnd.expect_Error();
        _file.handler = hnd.expect();
        return VfsOperationResult.Ok;
    }

    public unlink_Block(file: VfsId) {
        const _file = this.get_Node(file);
        if (_file === undefined || !(_file instanceof VfsFileNode) || this.is_OrphanNode(_file.id) || _file.handler === undefined) return VfsOperationResult.SrcInvalid;
        const hnd = _file.handler;
        _file.handler = undefined;
        return this.close_Handler(hnd);
    }

    public open_File(node: VfsId): Result<VfsId, VfsOperationResult> {
        const _node = this.get_Node(node);
        if (_node === undefined || !(_node instanceof VfsFileNode) || this.is_OrphanNode(_node.id) || _node.handler === undefined) return Result.Error(VfsOperationResult.SrcInvalid);
        const _handler = this.get_Handler(_node.handler);
        if (_handler === undefined) return Result.Error(VfsOperationResult.SrcInvalid);
        const _block = this.get_Block(_handler.block);
        if (_block === undefined) return Result.Error(VfsOperationResult.SrcInvalid);
        return this.create_Handler(_block.id);
    }

    // #endregion

    public print(node: VfsId = RootVfsId) {
        const _node = this.get_Node(node);
        if (_node === undefined) return;
        if (_node instanceof VfsFileNode) {
            console.log(`file(${_node.id})[${_node.name ?? '/'}]`, _node.handler ? ` -> blockhnd(${_node.handler})` : 'empty');
            return;
        }
        else if (_node instanceof VfsDirectoryNode) {
            console.group(`dir(${_node.id})[${_node.name ?? '/'}]`);
            for (const i of _node.subs) {
                this.print(i);
            }
            console.groupEnd();
        }
        if (node === RootVfsId) {
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
        }
    }
}

abstract class VfsNode {
    public id: VfsId;
    public name: string | undefined;
    public readonly fs: VirtualFileSystem;

    public parent: VfsId | undefined;

    public user: UserId = SuperUser;
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

    constructor(id: VfsId, fs: VirtualFileSystem) {
        this.id = id;
        this.fs = fs;
    }
}

class VfsHandler {
    public id: VfsId;
    public readonly fs: VirtualFileSystem;

    public readonly block: VfsId;
    
    public mode: VfsMode = VfsMode.None;

    constructor(id: VfsId, fs: VirtualFileSystem, node: VfsId) {
        this.id = id;
        this.fs = fs;
        this.block = node;
    }
}

// const vfs = new VirtualFileSystem();
// const dir0 = vfs.create_Directory();
// const dir1 = vfs.create_Directory();
// vfs.attach_Node(dir0);
// vfs.attach_Node(dir1, dir0);

// const file0 = vfs.create_File();
// vfs.attach_Node(file0, dir1);
// const file1 = vfs.create_File();
// vfs.attach_Node(file1, dir0);

// // const handler0 = vfs.open_Node(file0).expect();
// // const handler1 = vfs.open_Node(file1).expect();
// // const handler2 = vfs.open_Node(dir0).expect();

// vfs.detach_Node(file1);
// vfs.detach_Node(dir0);
// vfs.attach_Node(dir0);
// vfs.attach_Node(file1, dir0);

// // const handler3 = vfs.open_Node(file1).expect();

// vfs.set_NodeName(dir0, '文件夹1');
// vfs.set_NodeName(dir1, '文件夹2');
// vfs.set_NodeName(file0, 'test.lttm');
// vfs.set_NodeName(file1, 'hello_world');

// const block0 = vfs.create_Block();
// const block1 = vfs.create_Block();

// vfs.link_Block(file0, block0);
// vfs.link_Block(file1, block1);

// const handler0 = vfs.open_File(file1).expect();

// vfs.detach_Node(file1);
// vfs.delete_Node(file1);

// vfs.close_Handler(handler0);

// // exec(vfs.close_Node(handler2));

// // exec(vfs.detach_Node(dir0));
// // exec(vfs.delete_Node(dir0));

// vfs.print();