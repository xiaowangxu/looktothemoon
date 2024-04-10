export class FileSystemPath {
    public static Root = '/';
    public static Current = '.';
    public static Parent = '..';

    static readonly #empty_routers = [];

    public readonly routers: string[] = [];

    public get is_valid() {
        return this.routers !== FileSystemPath.#empty_routers;
    }
    public get is_absolute() {
        return this.is_valid && this.routers[0] === FileSystemPath.Root;
    }
    public get path() {
        if (!this.is_valid) return '';
        if (this.routers[0] === FileSystemPath.Root) return `/${this.routers.slice(1).join('/')}`;
        return this.routers.join('/');
    }
    public readonly is_file: boolean;
    public get dir() {
        if (!this.is_valid) return '';
        if (this.is_file) {
            if (this.routers[0] === FileSystemPath.Root) return `/${this.routers.slice(1, -1).join('/')}`;
            return this.routers.slice(0, -1).join('/');
        }
        else return this.path;
    }
    public get name() {
        if (!this.is_valid) return '';
        const last = this.routers[this.routers.length - 1];
        if (this.is_file) {
            const items = last.split('.');
            return items.slice(0, -1).join('.');
        }
        else {
            return last;
        }
    }
    public get tags(){
        const name = this.name;
        if (name === '') return [];
        return name.split('.').slice(1);
    }
    public get ext() {
        if (!this.is_valid || !this.is_file) return '';
        const last = this.routers[this.routers.length - 1];
        return last.slice(last.lastIndexOf('.'));
    }

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

    // static readonly #path_regax = /^((?<dir>([^\/^\s^\.]+:\/\/|\/)))?(?<parent>(([^\/^\s^\.]+|\.{1,2})\/)*)((?<file>[^\/^\s^\.]*(\.[^\/^\s^\.]+)*)|(?<folder>\.{1,2}))?$/;
    static readonly #path_regax = /^((?<dir>([^\/\.\r\n\t\f\v:]+:\/\/|\/)))?(?<parent>(([^\/\.\r\n\t\f\v:]+|\.{1,2})\/)*)((?<file>[^\/\.\r\n\t\f\v:]*(\.[^\/\.\s:]+)*)|(?<folder>\.{1,2}))?$/;
    
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

// // test
// let p0;

// p0 = fspath('res://test/a/b/c.ignore.txt');
// console.log('res://test/a/b/c.ignore.txt');
// console.log('v', p0.is_valid, 'if', p0.is_file, 'abs', p0.is_absolute, 'dir:', p0.dir, 'name:', p0.name, 'ext:', p0.ext);

// p0 = fspath('/usr/share/ovirt_plugin/password-test.ignore.txt');
// console.log('/usr/share/ovirt_plugin/password-test.ignore.txt');
// console.log('v', p0.is_valid, 'if', p0.is_file, 'abs', p0.is_absolute, 'dir:', p0.dir, 'name:', p0.name, 'ext:', p0.ext);

// p0 = fspath('res://test/a/.././test/a');
// console.log('res://test/a/.././test/a');
// console.log('v', p0.is_valid, 'if', p0.is_file, 'abs', p0.is_absolute, 'dir:', p0.dir, 'name:', p0.name, 'ext:', p0.ext);

// p0 = fspath('./../a');
// console.log('./../a');
// console.log('v', p0.is_valid, 'if', p0.is_file, 'abs', p0.is_absolute, 'dir:', p0.dir, 'name:', p0.name, 'ext:', p0.ext);