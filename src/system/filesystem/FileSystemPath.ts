export class FileSystemPath {
    public static Root = '/';
    public static Current = '.';
    public static Parent = '..';

    static #empty_routers = [];

    public readonly routers: string[] = [];

    public get is_valid() {
        return this.routers !== FileSystemPath.#empty_routers;
    }
    public get is_absolute() {
        return this.is_valid && this.routers[0] === FileSystemPath.Root;
    }
    public get path() {
        if (this.routers.length === 0) return '';
        if (this.routers[0] === FileSystemPath.Root) return `/${this.routers.slice(1).join('/')}`;
        return this.routers.join('/');
    }
    public readonly is_file: boolean;

    *[Symbol.iterator]() {
        if (!this.is_valid) return;
        const len = this.routers.length;
        for (let i = 0; i < len; i++) {
            yield { item: this.routers[i], is_file: this.is_file && i === len - 1 };
        }
    }

    public *get_IgnoredRootIter() {
        if (!this.is_valid) return;
        const len = this.routers.length;
        for (let i = 1; i < len; i++) {
            yield { item: this.routers[i], is_file: this.is_file && i === len - 1 };
        }
    }

    constructor(routers: string[] = FileSystemPath.#empty_routers) {
        // format
        let _routers: string[] = routers.length === 0 ? FileSystemPath.#empty_routers : [];
        for (const i of routers) {
            if (i === FileSystemPath.Current) {
                continue;
            }
            else if (i === FileSystemPath.Parent) {
                if (_routers.length > 0 && _routers[_routers.length - 1] !== FileSystemPath.Parent && _routers[_routers.length - 1] !== FileSystemPath.Root) _routers.pop();
                else if (_routers.length === 1 && _routers[0] === FileSystemPath.Root) {
                    _routers = FileSystemPath.#empty_routers;
                    break;
                }
                else _routers.push(FileSystemPath.Parent);
            }
            else {
                _routers.push(i);
            }
        }
        this.routers = _routers.length === 0 ? FileSystemPath.#empty_routers : _routers;
        if (!this.is_valid) this.is_file = false;
        else {
            const last = this.routers[this.routers.length - 1];
            this.is_file = last !== FileSystemPath.Current && last !== FileSystemPath.Parent && last.includes('.');
        }
    }

    static #path_regax = /^((?<dir>([\w_]+:\/\/|\/)))?(?<parent>(([\w]+|\.{1,2})\/)*)((?<file>[\w]*)(\.(?<filetype>[\w]+))?|(?<folder>\.{1,2}))?$/;

    public static from_Path(path: string) {
        const result = FileSystemPath.#path_regax.exec(path);
        if (result === null) return new FileSystemPath();
        const { dir, parent, file, filetype, folder } = result.groups ?? {};
        const routers: string[] = [];
        if (dir !== undefined) {
            if (dir === FileSystemPath.Root) routers.push(FileSystemPath.Root);
            else routers.push(FileSystemPath.Root, dir.substring(0, dir.length - 3));
        }
        if (parent !== undefined) {
            const subs = parent.split('/');
            for (let i = 0; i < subs.length - 1; i++) {
                const folder = subs[i];
                routers.push(folder);
            }
        }
        if (file !== undefined) {
            if (filetype !== undefined) routers.push(`${file}.${filetype}`);
            else routers.push(file);
        }
        else if (folder !== undefined) {
            routers.push(folder);
        }
        return new FileSystemPath(routers);
    }

    public static merge(base: FileSystemPath, path: FileSystemPath) {
        if (!base.is_valid || !path.is_valid || base.is_file) return new FileSystemPath();
        const _path = path.routers;
        if (_path[0] === FileSystemPath.Root) return path;
        const _base = base.routers;
        return new FileSystemPath([..._base, ..._path]);
    }
}

export function fspath(path: string): FileSystemPath;
export function fspath(path: string, base?: string): FileSystemPath {
    if (base === undefined) return FileSystemPath.from_Path(path);
    return FileSystemPath.merge(FileSystemPath.from_Path(base), FileSystemPath.from_Path(path))
}