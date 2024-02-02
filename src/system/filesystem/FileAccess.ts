import { FileSystemPath, fspath } from "./FileSystemPath";
import { VFS, VfsMode, type VfsId, type VirtualFileSystem, VfsOperationResult } from "./VirtualFileSystem";

export class FileAccess {
    private handler: VfsId | undefined = undefined;
    private readonly fs: VirtualFileSystem;
    private readonly path: FileSystemPath;

    public get is_opened() {
        return this.handler !== undefined;
    }

    constructor(path: string | FileSystemPath, mode: VfsMode, create_file: boolean = true, fs: VirtualFileSystem = VFS) {
        this.fs = fs;
        this.path = path instanceof FileSystemPath ? path : fspath(path);
        const hnd = this.fs.open(this.path, mode, create_file);
        if (hnd.failed) {
            this.handler = undefined;
        }
        else {
            this.handler = hnd.expect();
        }
    }

    public read_Binary() {
        if (!this.is_opened) return undefined;
        const data = this.fs.read(this.handler!);
        if (data.failed) return undefined;
        return data.expect();
    }

    public write_Binary(data: ArrayBuffer): boolean {
        if (!this.is_opened) return false;
        if (this.fs.write(this.handler!, data) !== VfsOperationResult.Ok) return false;
        if (this.fs.flush(this.path, this.handler!) !== VfsOperationResult.Ok) return false;
        return true;
    }

    public read_String(encoding?: string) {
        const buffer = this.read_Binary();
        if (buffer === undefined) return undefined;
        return new TextDecoder(encoding).decode(buffer);
    }

    public write_String(data: string): boolean {
        if (!this.is_opened) return false;
        const buffer = new TextEncoder().encode(data);
        return this.write_Binary(buffer);
    }

    public close() {
        if (this.is_opened) {
            this.fs.close(this.handler!);
            this.handler = undefined;
        }
    }
}