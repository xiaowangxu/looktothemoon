import type { Rid } from '../../Rid';
import { Result } from '../../../utils/Result';
import { ClassBase } from "../class_database/ClassBase";
import { ClassDB, type ClassDatabase } from '../class_database/ClassDatabase';
import { ClassReader, ClassRef, ClassWriter } from './ClassWriterReader';
import { ResourceBase, ResourceInstanceCache } from '../../resources/Resource';
import { ClassDecoder, type ClassEncoder } from './encoder_decoders/ClassEncoderDecoder';
import { fspath } from '@/system/filesystem/FileSystemPath';
import { VFS, VfsMode, VfsOperationResult } from '@/system/filesystem/VirtualFileSystem';
import { ClassBinaryDecoder, ClassBinaryEncoder } from './encoder_decoders/ClassBinaryEncoderDecoder';

export type RefId = number;

type PropertyMap = Map<string, any>;

export type ClassInstanceData = {
    type: string,
    refid: RefId,
    // only for resources
    // mark whether local resource is unique, for external resource the uniqueness is maked inside the external resource file itself so this is ignored
    // for resource default unique is false, but some resource type may override it to true, the loader will first check this then the resource's default unique, namely !unique && !Resource.unique will cause a cache operation
    unique: boolean | undefined,
    external: string | undefined,
    uid: bigint,
    property: PropertyMap | undefined,
}

export type ClassExchangeData = { root: RefId, uid: bigint, meta: PropertyMap | undefined, instances: ClassInstanceData[] };

// #region Saver

export interface ClassSaverOption {
    static?: boolean,
}

function save_File(path: string, data: ArrayBuffer): Result<undefined, Error> {
    const p = fspath(path);
    if (p.routers[1] !== undefined && p.routers[1] === 'download') {
        if (p.routers.length > 3 || p.routers[2] === undefined) return Result.Error(new Error(`<ClassSaver> save: download path ${path} is not valid`));
        download_File(p.routers[2], data);
        return Result.Ok(undefined);
    }
    if (!p.is_valid) {
        return Result.Error(new Error(`<save_File> : path is invalid`));
    }
    const _hnd = VFS.open(p, VfsMode.Write, true);
    if (_hnd.failed) {
        return Result.Error(new Error(`<save_File> : fail to open file ${p.path}`));
    }
    const hnd = _hnd.expect();
    if (VFS.write(hnd, data) !== VfsOperationResult.Ok) {
        VFS.close(hnd);
        return Result.Error(new Error(`<save_File> : fail to write file ${p.path}`));
    }
    if (VFS.flush(p, hnd, false) !== VfsOperationResult.Ok) {
        VFS.close(hnd);
        return Result.Error(new Error(`<save_File> : fail to write file ${p.path}`));
    }
    VFS.close(hnd);
    return Result.Ok(undefined);
}

export function download_File(name: string, data: ArrayBuffer) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(
        [data],
        { type: 'application/octet-stream' }
    ));
    a.download = name;
    a.click();
}

export class ClassSaver {
    private readonly class_db: ClassDatabase;

    private _refid: number = 0;
    private get refid() { return this._refid++; }

    private readonly rid_instance_data_map: Map<Rid, ClassInstanceData> = new Map();
    private readonly refid_rid_map: Map<RefId, Rid> = new Map();

    private root_refid: RefId | undefined

    // options

    private static_mode: boolean = false;

    constructor(class_db: ClassDatabase = ClassDB) {
        this.class_db = class_db;
    }

    // data api

    public create_Data(rid: Rid, type: string, unique: boolean | undefined = undefined, external: string | undefined = undefined, uid: bigint = 0n): RefId {
        if (this.rid_instance_data_map.has(rid)) return this.rid_instance_data_map.get(rid)!.refid;
        else {
            const refid = this.refid;
            this.refid_rid_map.set(refid, rid);
            this.rid_instance_data_map.set(rid, {
                refid,
                type,
                unique,
                external,
                uid,
                property: new Map(),
            });
            return refid;
        }
    }

    public create_Ref(rid: Rid) {
        if (this.rid_instance_data_map.has(rid)) return new ClassRef(this.rid_instance_data_map.get(rid)!.refid);
        return undefined;
    }

    public set_Root(refid: RefId) {
        this.root_refid = refid;
    }

    public add_Property(rid: Rid, key: string, value: any) {
        if (value === undefined || value === null) return;
        if (this.rid_instance_data_map.has(rid)) {
            const data = this.rid_instance_data_map.get(rid)!;
            if (data.property === undefined) data.property = new Map<string, any>();
            data.property.set(key, value);
        }
        else {
            throw new Error('<ClassSaverScope> add_Property: can not set property data, because instance dose not exist');
        }
    }

    private get_Data(): Result<ClassExchangeData, Error> {
        const root_refid = this.root_refid;
        if (root_refid === undefined) return Result.Error(new Error('<ClassSaver> get_Data: no root instance to be saved'));
        const rid = this.refid_rid_map.get(root_refid);
        if (rid === undefined || !this.rid_instance_data_map.has(rid)) return Result.Error(new Error('<ClassSaver> get_Data: root instance not registered'));
        return Result.Ok({
            root: root_refid,
            uid: this.rid_instance_data_map.get(rid)!.uid,
            meta: new Map([
                ['author', 'lttmsaver'],
                ['date', new Date().toISOString()]
            ]),
            instances: [...this.rid_instance_data_map.values()],
        });
    }

    // instance api

    private can_SaveExternal(obj: ClassBase, is_root: boolean) {
        return !this.static_mode && !is_root && obj instanceof ResourceBase && obj.is_external;
    }

    private create_Instance(obj: ClassBase, is_root: boolean = false): Result<RefId, Error> {
        const class_name = (obj.constructor as typeof ClassBase).class_name;
        if (!this.class_db.has_Class(class_name)) return Result.Error(new Error(`<ClassSaverScope> create_Instance: instance class ${class_name} is not registered`));
        const rid = obj.rid;
        return Result.Ok(this.create_Data(
            rid,
            class_name,
            obj instanceof ResourceBase ? obj.unique : undefined,
            this.can_SaveExternal(obj, is_root) ? (obj as ResourceBase).path : undefined,
        ));
    }

    public add_InstanceProperty(base: ClassBase, key: string, value: any) {
        this.add_Property(base.rid, key, value);
    }

    public create_InstanceRef(obj: ClassBase): ClassRef {
        const obj_rid = obj.rid;
        if (!this.rid_instance_data_map.has(obj_rid)) {
            const refid_res = this.create_Instance(obj);
            if (refid_res.failed) throw refid_res.expect_Error();
            this.dump_Instance(obj);
            return new ClassRef(refid_res.expect());
        }
        else {
            return new ClassRef(this.rid_instance_data_map.get(obj_rid)!.refid);
        }
    }

    private dump_Instance(obj: ClassBase, is_root: boolean = false) {
        if (this.can_SaveExternal(obj, is_root)) return;
        obj.dump(new ClassWriter(this, obj));
    }

    // main apis

    public init(option?: ClassSaverOption) {
        this._refid = 0;
        this.rid_instance_data_map.clear();
        this.root_refid = undefined;
        // set options
        this.static_mode = option?.static ?? false;
    }

    public enocde<T, Option>(data: ClassExchangeData, encoder: typeof ClassEncoder<T, Option>, option?: Option): Result<T, Error> {
        const _encoder = new (encoder)(data, option);
        return _encoder.encode();
    }

    public save(obj: ClassBase | undefined, path: string, save_option?: ClassSaverOption): Result<undefined, Error> {
        let res: Result<ArrayBuffer, Error>;
        if (obj === undefined) {
            const data = this.get_Data();
            if (data.failed) return Result.Error(data.expect_Error());
            res = this.enocde(data.expect(), ClassBinaryEncoder);
        }
        else {
            res = this.dump(obj, ClassBinaryEncoder, save_option);
        }
        if (res.failed) return Result.Error(res.expect_Error());
        const data = res.expect();
        const p = fspath(path);
        if (!p.is_valid || !p.is_absolute || !p.is_file) return Result.Error(new Error(`<ClassSaver> save: path ${path} is not valid`));
        const save = save_File(path, data);
        if (save.failed) return save;
        return Result.Ok(undefined);
    }

    private dump<T, Option>(obj: ClassBase, encoder: typeof ClassEncoder<T, Option>, option?: ClassSaverOption, encode_option?: Option): Result<T, Error> {
        this.init(option);
        try {
            const refid_res = this.create_Instance(obj, true);
            if (refid_res.failed) return Result.Error(refid_res.expect_Error());
            this.set_Root(refid_res.expect());
            this.dump_Instance(obj, true);
            const data = this.get_Data();
            if (data.failed) return Result.Error(data.expect_Error());
            return this.enocde(data.expect(), encoder, encode_option);
        }
        catch (err) {
            return Result.Error(err as Error);
        }
    }
}

// #endregion

// #region Loader

export interface ClassLoaderOption {
    disable_use_cache?: boolean,
    disable_store_cache?: boolean,
}

function load_File(path: string): Result<ArrayBuffer, Error> {
    const p = fspath(path);
    if (!p.is_valid) {
        return Result.Error(new Error(`<load_File> : path is invalid`));
    }
    const _hnd = VFS.open(p, VfsMode.Read, false);
    if (_hnd.failed) {
        return Result.Error(new Error(`<load_File> : fail to open file ${p.path}`));
    }
    const hnd = _hnd.expect();
    const data = VFS.read(hnd);
    if (data.failed) {
        VFS.close(hnd);
        return Result.Error(new Error(`<load_File> : fail to read file ${p.path}`));
    }
    const d = data.expect();
    if (d === undefined) {
        VFS.close(hnd);
        return Result.Error(new Error(`<load_File> : file ${p.path} is empty`));
    }

    VFS.close(hnd);
    return Result.Ok(d);
}

export class ClassLoader {
    private readonly class_db: ClassDatabase;

    private readonly resource_instance_cache: ResourceInstanceCache;

    // options

    private disable_use_cache: boolean = false;
    private disable_store_cache: boolean = false;

    private readonly refid_instance_map: Map<RefId, { external: boolean, instance: ClassBase, property?: PropertyMap }> = new Map();

    constructor(resource_instance_cache: ResourceInstanceCache, class_db: ClassDatabase = ClassDB) {
        this.class_db = class_db;
        this.resource_instance_cache = resource_instance_cache;
    }

    // parse methods

    public get_Instance(refid: RefId) {
        return this.refid_instance_map.get(refid)?.instance;
    }

    private parse_Instance(instance: ClassInstanceData): Result<RefId, Error> {
        const { type, refid, property } = instance;
        const prop = property;
        const class_instance = this.class_db.instantiate(type);
        if (class_instance.failed) return Result.Error(class_instance.expect_Error())
        this.refid_instance_map.set(refid, { external: false, instance: class_instance.expect(), property: prop });
        return Result.Ok(refid);
    }

    private parse_ExternalInstance(instance: ClassInstanceData): Result<RefId, Error> {
        const { refid, external } = instance;
        if (external === undefined) return Result.Error(new Error('<ClassLoader> parse_ExternalInstance: external resource dose not has external path'));
        const result = new ClassLoader(this.resource_instance_cache, this.class_db).fetch(external);
        if (result.failed) throw result.expect_Error();
        this.refid_instance_map.set(refid, { external: true, instance: result.expect() });
        return Result.Ok(refid);
    }

    private load_InstanceProperty(instance: ClassBase, property: PropertyMap) {
        instance.load(new ClassReader(this, property));
    }

    private get_InstanceInternalPath(path: string, instance: ClassInstanceData) {
        return `${path}:${instance.type}(${instance.refid})`;
    }

    private init(option?: ClassLoaderOption) {
        this.refid_instance_map.clear();
        // set options
        this.disable_use_cache = option?.disable_use_cache ?? false;
        this.disable_store_cache = option?.disable_store_cache ?? false;
    }

    private parse<T extends ClassBase>(data: ClassExchangeData, path?: string, option?: ClassLoaderOption): Result<T, Error> {
        this.init(option);
        // parse
        const { root, instances } = data;
        const root_refid = new ClassRef(root);
        const externals: ClassInstanceData[] = [];
        // parse instance and mark externals
        for (const instance of instances) {
            const { external, unique = false, refid } = instance;
            // intance ref a external resource
            if (external !== undefined) {
                externals.push(instance);
                continue;
            }
            // try use cached
            if (path !== undefined && !this.disable_use_cache) {
                const instance_refid = new ClassRef(refid);
                if (instance_refid.refid !== root_refid.refid) {
                    const cache_path = this.get_InstanceInternalPath(path, instance);
                    const cached = this.resource_instance_cache.get(cache_path);
                    if (cached !== undefined) {
                        this.refid_instance_map.set(instance_refid.refid, { external: true, instance: cached });
                        continue;
                    }
                }
            }
            // instantiate class instance
            const instance_refid_res = this.parse_Instance(instance);
            if (instance_refid_res.failed) return Result.Error(instance_refid_res.expect_Error());
            const instance_refid = instance_refid_res.expect();
            // if has path find root set its path and register it to cache
            const the_instance = this.get_Instance(instance_refid);
            if (the_instance !== undefined && the_instance instanceof ResourceBase) {
                // deal with uniqueness
                if (path !== undefined && !unique && !the_instance.unique) {
                    if (instance_refid === root_refid.refid) {
                        the_instance.path = path;
                        if (!this.disable_store_cache) this.resource_instance_cache.add(path, the_instance);
                    }
                    else if (!this.disable_store_cache) {
                        const cache_path = this.get_InstanceInternalPath(path, instance);
                        this.resource_instance_cache.add(cache_path, the_instance);
                    }
                }
                the_instance.unique ||= unique;
            }
        }
        // return root instance
        const root_instance = this.get_Instance(root_refid.refid);
        // load external resources
        for (const external of externals) {
            if (external.external !== undefined && path !== undefined && external.external === path) {
                return Result.Error(new Error('<ClassLoader> parse@external: sub external file instance is its owner, this is not possible'));
            }
            else {
                const res = this.parse_ExternalInstance(external);
                if (res.failed) return Result.Error(res.expect_Error());
            }
        }
        // load instance properties
        for (const { external, instance, property } of this.refid_instance_map.values()) {
            if (external || property === undefined) continue;
            this.load_InstanceProperty(instance, property);
        }
        if (root_instance === undefined) return Result.Error(new Error('<ClassLoader> parse: fail to load root instance'));
        return Result.Ok(root_instance as T);
    }

    private decode<T, Option>(data: T, decoder: typeof ClassDecoder<T, Option>, option?: Option): Result<ClassExchangeData, Error> {
        const _decoder = new (decoder)(data, option);
        return _decoder.decode();
    }

    // main apis

    public fetch<T extends ClassBase>(path: string, load_option?: ClassLoaderOption): Result<T, Error> {
        const cache = this.resource_instance_cache.get<ResourceBase>(path);
        if (cache !== undefined) return Result.Ok((cache as unknown) as T);
        const file = load_File(path);
        if (file.failed) return Result.Error(file.expect_Error());
        const decoded = this.decode(file.expect(), ClassBinaryDecoder, { validate: false });
        if (decoded.failed) return Result.Error(decoded.expect_Error());
        return this.parse<T>(decoded.expect(), path, load_option);
    }

    public load<T extends ClassBase, D, Option>(data: D, decoder: typeof ClassDecoder<D, Option>, load_option?: ClassLoaderOption, decode_option?: Option): Result<T, Error> {
        const decoded = this.decode(data, decoder, decode_option);
        if (decoded.failed) return Result.Error(decoded.expect_Error());
        return this.parse<T>(decoded.expect(), undefined, load_option);
    }
}

// #endregion