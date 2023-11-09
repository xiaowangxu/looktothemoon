import { IncTopoGraph, IncTopoGraphResult } from '../../structures/IncTopoGraph';
import { Result } from '../../utils/Result';
import { ClassBase } from './ClassBase';
import { ClassDB, type ClassDataBase, ValueDB, ValueDataBase } from './ClassValueDataBase';
import { ClassExternalPath, ClassReader, ClassRef, ClassWriter } from './ClassWriterReader';
import type { RID } from '../Rid';
import { load_ResFile_from_Path } from 'res://ResFiles';
import { DefaultResourceInstanceCache, Resource, ResourceInstanceCache } from '../Resource';
import { generateUUID } from 'three/src/math/MathUtils.js';

export type RefId = string;

ValueDB.register_Value('classref', ClassRef, v => v.refid, v => new ClassRef(v));
ValueDB.register_Value('external', ClassExternalPath, v => v.path, v => new ClassExternalPath(v));

type InstanceData = {
    refid: RefId,
    class: string,
    unique: boolean,
    external_path: string | undefined,
    data_initialization: Map<string, any>,
    data_property: Map<string, any>,
}

export class ClassSaverScope {
    private readonly class_db: ClassDataBase;

    private _refid: bigint = 0n;
    private get refid() { return (this._refid++).toString(); }

    private readonly graph: IncTopoGraph<RID> = new IncTopoGraph();
    private readonly rid_instance_data_map: Map<RID, InstanceData> = new Map();

    private _root_refid: RefId | undefined
    public get root_refid() { return this._root_refid; }

    // option
    private static_mode: boolean = false;

    constructor(class_db: ClassDataBase = ClassDB) {
        this.class_db = class_db;
    }

    private can_SaveExternal(obj: ClassBase, is_root: boolean) {
        return !this.static_mode && !is_root && obj instanceof Resource && obj.is_external;
    }

    private create_Instance(obj: ClassBase, is_root: boolean = false): RefId {
        const class_name = (obj.constructor as typeof ClassBase).class_name;
        if (!this.class_db.has_Class(class_name)) throw new Error(`instance class ${class_name} is not registered`);
        const rid = obj.rid;
        if (this.rid_instance_data_map.has(rid)) return this.rid_instance_data_map.get(rid)!.refid;
        else {
            const refid = this.refid;
            this.rid_instance_data_map.set(rid, {
                refid,
                class: class_name,
                unique: obj instanceof Resource ? obj.unique : false,
                external_path: this.can_SaveExternal(obj, is_root) ? (obj as Resource).path : undefined,
                data_initialization: new Map(),
                data_property: new Map(),
            });
            this.graph.add(rid);
            return refid;
        }
    }

    private make_Ref(base: ClassBase, obj: ClassBase) {
        const base_rid = base.rid;
        const obj_rid = obj.rid;
        if (this.graph.has(base_rid) && this.graph.has(obj_rid)) {
            const result = this.graph.ref(base_rid, obj_rid);
            if (result === IncTopoGraphResult.Ok) {
                return true;
            }
            else if (result === IncTopoGraphResult.Existed) {
                return true;
            }
            return false;
        }
        return true;
    }

    public add_Initialization(base: ClassBase, key: string, value: any) {
        const rid = base.rid;
        if (this.rid_instance_data_map.has(rid)) {
            const data = this.rid_instance_data_map.get(rid)!.data_initialization;
            data.set(key, value);
        }
        else {
            throw new Error('can not set initialization data because instance dose not exist');
        }
    }

    public add_Property(base: ClassBase, key: string, value: any) {
        const rid = base.rid;
        if (this.rid_instance_data_map.has(rid)) {
            const data = this.rid_instance_data_map.get(rid)!.data_property;
            data.set(key, value);
        }
        else {
            throw new Error('can not set property data because instance dose not exist');
        }
    }

    public add_Ref(obj: ClassBase): ClassRef {
        const obj_rid = obj.rid;
        if (!this.rid_instance_data_map.has(obj_rid)) {
            const refid = this.create_Instance(obj);
            this.dump_Instance(obj);
            return new ClassRef(refid);
        }
        else {
            return new ClassRef(this.rid_instance_data_map.get(obj_rid)!.refid);
        }
    }

    public create_Ref(base: ClassBase, obj: ClassBase): ClassRef {
        const base_rid = base.rid;
        const obj_rid = obj.rid;
        if (!this.rid_instance_data_map.has(base_rid)) throw new Error('can not make reference because base instance does not exist');
        let refid: RefId;
        if (!this.rid_instance_data_map.has(obj_rid)) {
            refid = this.create_Instance(obj);
            this.dump_Instance(obj);
        }
        else {
            refid = this.rid_instance_data_map.get(obj_rid)!.refid;
        }
        if (obj instanceof Resource && obj.is_external) throw new Error('external resource can not be used as initialization data');
        if (!this.make_Ref(base, obj)) throw new Error(`cyclic reference detected when referencing ${(base.constructor as typeof ClassBase).class_name}(${base.rid}) to ${(obj.constructor as typeof ClassBase).class_name}(${obj.rid})`);
        return new ClassRef(refid);
    }

    private dump_Instance(obj: ClassBase, is_root: boolean = false) {
        if (this.can_SaveExternal(obj, is_root)) return;
        obj.dump(new ClassWriter(this, obj));
    }

    public dump(obj: ClassBase, option?: ClassSaverDumpOption) {
        this.static_mode = option?.static ?? false;
        this._refid = 0n;
        this.graph.clear();
        this.rid_instance_data_map.clear();
        this._root_refid = this.create_Instance(obj, true);
        this.dump_Instance(obj, true);
    }

    public get_SortedInstanceData() {
        return this.graph.sorted.map(rid => this.rid_instance_data_map.get(rid.item)!);
    }
}

type LTTMClassDescriptorInstance = {
    type: string,
    refid: string,
    // mark whether local resource is unique , for external resource the uniqueness is maked inside the external resource file itself so this is ignored
    // for resource default unique is false, but some resource type may override it to true, the loader will first check this then the resource's default unique
    unique: boolean,
    external?: string,
    initialization?: { [key: string]: string },
    property?: { [key: string]: string },
}

type LTTMClassDescriptor = {
    type: 'LTTMClassDescriptor',
    meta: {
        date: string,
        version: string,
        author?: string,
    },
    root: string,
    instances: LTTMClassDescriptorInstance[],
}

export interface ClassSaverDumpOption {
    static?: boolean,
}

const ClassSaverLoaderTypeName = 'LTTMClassDescriptor';
const ClassSaverLoaderVersion = '0.0.1';

export class ClassSaver {
    private readonly scope: ClassSaverScope;
    private readonly value_db: ValueDataBase;

    constructor(class_db: ClassDataBase = ClassDB, value_db: ValueDataBase = ValueDB) {
        this.scope = new ClassSaverScope(class_db);
        this.value_db = value_db;
    }

    public dump(obj: ClassBase, option?: ClassSaverDumpOption): Error | undefined {
        try {
            this.scope.dump(obj, option);
        }
        catch (err) {
            return err as Error;
        }
    }

    public get_Data(): Result<{ root: string, instances: InstanceData[] }, Error> {
        const root_refid = this.scope.root_refid;
        if (root_refid === undefined) return Result.Error(new Error('no root instance to be saved'));
        return Result.Ok({
            root: root_refid,
            instances: this.scope.get_SortedInstanceData(),
        });
    }

    public get_JsonString(space?: string | number): Result<string, Error> {
        const root_refid = this.scope.root_refid;
        if (root_refid === undefined) return Result.Error(new Error('no root instance to be saved'));
        const sorted = this.scope.get_SortedInstanceData();
        const instances: LTTMClassDescriptorInstance[] = [];
        for (const { refid, class: class_name, unique, external_path, data_initialization, data_property } of sorted) {
            const instance_refid = this.value_db.save_Value(new ClassRef(refid));
            if (external_path === undefined) {
                const init: { [key: string]: string } = {};
                const prop: { [key: string]: string } = {};
                const has_init = data_initialization.size > 0;
                const has_prop = data_property.size > 0;
                if (has_init) {
                    for (const [key, value] of data_initialization.entries()) {
                        init[key] = this.value_db.save_Value(value);
                    }
                }
                if (has_prop) {
                    for (const [key, value] of data_property.entries()) {
                        prop[key] = this.value_db.save_Value(value);
                    }
                }
                instances.push({
                    type: class_name,
                    refid: instance_refid,
                    unique: unique,
                    initialization: has_init ? init : undefined,
                    property: has_prop ? prop : undefined,
                });
            }
            else {
                instances.push({
                    type: class_name,
                    refid: instance_refid,
                    unique: unique,
                    external: this.value_db.save_Value(new ClassExternalPath(external_path)),
                });
            }
        }
        const json: LTTMClassDescriptor = {
            type: ClassSaverLoaderTypeName,
            meta: {
                version: ClassSaverLoaderVersion,
                date: new Date(Date.now()).toISOString(),
                author: `LookToTheMoon ClassSaver v${ClassSaverLoaderVersion}`,
            },
            root: this.value_db.save_Value(new ClassRef(root_refid)),
            instances
        };
        return Result.Ok(JSON.stringify(json, undefined, space));
    }

    public save(obj: ClassBase, option?: ClassSaverDumpOption, space?: string | number): Result<string, Error> {
        const error = this.dump(obj, option);
        if (error !== undefined) return Result.Error(error);
        return this.get_JsonString(space);
    }

    public print() {
        const root_refid = this.scope.root_refid;
        if (root_refid === undefined) return;
        const sorted = this.scope.get_SortedInstanceData();
        for (const { refid, class: class_name, external_path, data_initialization, data_property } of sorted) {
            console.group(`${class_name} ref ${refid}${external_path === undefined ? ' internal' : ` external "${external_path}"`}`);
            if (external_path === undefined) {
                if (data_initialization.size > 0) {

                    console.group(`initialization`);
                    console.table([...data_initialization.entries()].map(([key, v]) => [key, this.value_db.save_Value(v)]));
                    console.groupEnd();
                }
                if (data_property.size > 0) {
                    console.group(`property`);
                    console.table([...data_property.entries()].map(([key, v]) => [key, this.value_db.save_Value(v)]));
                    console.groupEnd();
                }
            }
            console.groupEnd();
        }
    }
}

export class ClassLoader {
    private readonly class_db: ClassDataBase;
    private readonly value_db: ValueDataBase;
    private readonly resource_instance_cache: ResourceInstanceCache;

    private readonly instance_map: Map<RefId, { external: boolean, instance: ClassBase, property: { [key: string]: any } }> = new Map();

    constructor(class_db: ClassDataBase = ClassDB, value_db: ValueDataBase = ValueDB, resource_instance_cache: ResourceInstanceCache = DefaultResourceInstanceCache) {
        this.class_db = class_db;
        this.value_db = value_db;
        this.resource_instance_cache = resource_instance_cache;
    }

    public get_Instance(refid: RefId) {
        return this.instance_map.get(refid)?.instance;
    }

    private parse_Value<T>(value: string) {
        return this.value_db.load_Value(value) as T;
    }

    private parse_ValueItems(items: { [key: string]: string }) {
        const data: { [key: string]: string } = {};
        for (const [key, value] of Object.entries(items)) {
            const object = this.parse_Value<any>(value);
            data[key] = object;
        }
        return data;
    }

    private parse_ExternalInstance(instance: LTTMClassDescriptorInstance) {
        const { refid, external } = instance;
        if (external === undefined) throw new Error('external resource dose not has external path');
        const refid_object = this.parse_Value<ClassRef>(refid);
        const external_path = this.parse_Value<ClassExternalPath>(external);
        const result = new ClassLoader(this.class_db, this.value_db, this.resource_instance_cache).fetch(external_path.path);
        if (result.failed) throw result.error;
        this.instance_map.set(refid_object.refid, { external: true, instance: result.value, property: {} });
        return refid_object;
    }

    private parse_Instance(instance: LTTMClassDescriptorInstance) {
        const { type, refid, initialization, property } = instance;
        const refid_object: ClassRef = this.parse_Value(refid);
        const init = initialization !== undefined ? this.parse_ValueItems(initialization) : {};
        const prop = property !== undefined ? this.parse_ValueItems(property) : {};
        const class_instance = this.class_db.instantiate(type, new ClassReader(this, init));
        this.instance_map.set(refid_object.refid, { external: false, instance: class_instance, property: prop });
        return refid_object;
    }

    private load_InstanceProperty(instance: ClassBase, property: { [key: string]: any }) {
        instance.load(new ClassReader(this, property));
    }

    public parse<T extends ClassBase>(obj: LTTMClassDescriptor, path: string | undefined = undefined): Result<T, Error> {
        this.instance_map.clear();
        try {
            const { type, root, instances } = obj;
            if (type !== ClassSaverLoaderTypeName) throw new Error(`file's type is not ${ClassSaverLoaderTypeName} so it is not a invalid format`);
            const root_refid = this.parse_Value<ClassRef>(root);
            const externals: LTTMClassDescriptorInstance[] = [];
            for (const instance of instances) {
                const { external, unique, refid, type } = instance;
                if (external !== undefined) {
                    externals.push(instance);
                    continue;
                }
                // try use cached 
                if (path !== undefined) {
                    const instance_refid = this.parse_Value<ClassRef>(refid);
                    if (instance_refid.refid !== root_refid.refid) {
                        const cache_path = `${path}/${type}(${instance_refid.refid})`;
                        const cached = this.resource_instance_cache.get(cache_path);
                        if (cached !== undefined) {
                            this.instance_map.set(instance_refid.refid, { external: true, instance: cached, property: {} });
                            continue;
                        }
                    }
                }
                const instance_refid = this.parse_Instance(instance);
                // if has path find root set its path and register it to cache 
                const the_instance = this.get_Instance(instance_refid.refid);
                if (the_instance !== undefined && the_instance instanceof Resource) {
                    if (path !== undefined && !unique && !the_instance.unique) {
                        if (instance_refid.refid === root_refid.refid) {
                            the_instance.path = path;
                            this.resource_instance_cache.add(path, the_instance);
                        }
                        else {
                            const cache_path = `${path}/${type}(${instance_refid.refid})`;
                            this.resource_instance_cache.add(cache_path, the_instance);
                        }
                    }
                    the_instance.unique ||= unique;
                }
            }
            for (const external of externals) {
                this.parse_ExternalInstance(external);
            }
            for (const { external, instance, property } of this.instance_map.values()) {
                if (external) continue;
                this.load_InstanceProperty(instance, property);
            }
            const root_instance = this.get_Instance(root_refid.refid);
            if (root_instance === undefined) throw new Error('fail to load');
            return Result.Ok(root_instance as T);
        }
        catch (err) {
            return Result.Error(err as Error);
        }
    }

    private parse_Json<T extends ClassBase>(json: string, path: string | undefined = undefined) {
        const obj = JSON.parse(json) as LTTMClassDescriptor;
        return this.parse<T>(obj, path);
    }

    public fetch<T extends ClassBase>(path: string): Result<T, Error> {
        const cache = this.resource_instance_cache.get<Resource>(path);
        if (cache !== undefined) return Result.Ok((cache as unknown) as T);
        const file = load_ResFile_from_Path(path);
        if (file.failed) return Result.Error(file.error);
        return this.parse_Json<T>(file.value, path);
    }

    public load<T extends ClassBase>(json: string | LTTMClassDescriptor) {
        if (typeof (json) === 'string') return this.parse_Json<T>(json);
        else return this.parse<T>(json);
    }
}