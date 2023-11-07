import { IncTopoGraph, IncTopoGraphResult } from '../../structures/IncTopoGraph';
import { Result } from '../../utils/Result';
import { ClassBase } from './ClassBase';
import { ClassDB, type ClassDataBase, ValueDB, ValueDataBase } from './ClassValueDataBase';
import { ClassReader, ClassRef, ClassWriter } from './ClassWriterReader';
import type { RID } from '../Rid';

export type RefId = string;

ValueDB.register_Value('classref', ClassRef, v => v.refid, v => new ClassRef(v));

type InstanceData = {
    refid: RefId,
    class: string,
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

    constructor(class_db: ClassDataBase = ClassDB) {
        this.class_db = class_db;
    }

    private create_Instance(obj: ClassBase): RefId {
        const class_name = (obj.constructor as typeof ClassBase).class_name;
        if (!this.class_db.has_Class(class_name)) throw new Error(`instance class ${class_name} is not registered`);
        const rid = obj.rid;
        if (this.rid_instance_data_map.has(rid)) return this.rid_instance_data_map.get(rid)!.refid;
        else {
            const refid = this.refid;
            this.rid_instance_data_map.set(rid, {
                refid,
                class: class_name,
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

    public add_Ref(obj: ClassBase): RefId {
        const obj_rid = obj.rid;
        if (!this.rid_instance_data_map.has(obj_rid)) {
            const refid = this.create_Instance(obj);
            this.dump_Instance(obj);
            return refid;
        }
        else {
            return this.rid_instance_data_map.get(obj_rid)!.refid;
        }
    }

    public create_Ref(base: ClassBase, obj: ClassBase): RefId {
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
        if (!this.make_Ref(base, obj)) throw new Error(`cyclic reference detected when referencing ${(base.constructor as typeof ClassBase).class_name}(${base.rid}) to ${(obj.constructor as typeof ClassBase).class_name}(${obj.rid})`);
        return refid;
    }

    private dump_Instance(obj: ClassBase) {
        obj.dump(new ClassWriter(this, obj));
    }

    public dump(obj: ClassBase) {
        this._refid = 0n;
        this.graph.clear();
        this.rid_instance_data_map.clear();
        this._root_refid = this.create_Instance(obj);
        this.dump_Instance(obj);
    }

    public get_SortedInstanceData() {
        return this.graph.sorted.map(rid => this.rid_instance_data_map.get(rid.item)!);
    }
}

type LTTMClassDescriptorInstance = {
    type: string,
    refid: string,
    initialization: { [key: string]: string },
    property: { [key: string]: string },
}

type LTTMClassDescriptor = {
    type: 'LTTMClassDescriptor',
    root: string,
    instances: LTTMClassDescriptorInstance[]
}

export class ClassSaver {
    private readonly scope: ClassSaverScope;
    private readonly value_db: ValueDataBase;

    constructor(class_db: ClassDataBase = ClassDB, value_db: ValueDataBase = ValueDB) {
        this.scope = new ClassSaverScope(class_db);
        this.value_db = value_db;
    }

    public dump(obj: ClassBase): Error | undefined {
        try {
            this.scope.dump(obj);
        }
        catch (err) {
            return err as Error;
        }
    }

    public get_JsonString(space?: string | number | undefined): string | undefined {
        const root_refid = this.scope.root_refid;
        if (root_refid === undefined) return undefined;
        const sorted = this.scope.get_SortedInstanceData();
        const instances: LTTMClassDescriptorInstance[] = [];
        for (const { refid, class: class_name, data_initialization, data_property } of sorted) {
            const init: { [key: string]: string } = {};
            const prop: { [key: string]: string } = {};
            for (const [key, value] of data_initialization.entries()) {
                init[key] = this.value_db.save_Value(value);
            }
            for (const [key, value] of data_property.entries()) {
                prop[key] = this.value_db.save_Value(value);
            }
            instances.push({
                type: class_name,
                refid: this.value_db.save_Value(new ClassRef(refid)),
                initialization: init,
                property: prop,
            });
        }
        const json = {
            type: 'LTTMClassDescriptor',
            root: this.value_db.save_Value(new ClassRef(root_refid)),
            instances
        };
        return JSON.stringify(json, undefined, space);
    }

    public print() {
        const root_refid = this.scope.root_refid;
        if (root_refid === undefined) return;
        const sorted = this.scope.get_SortedInstanceData();
        for (const { refid, class: class_name, data_initialization, data_property } of sorted) {
            console.group(`${class_name} ref ${refid}`);
            console.group(`initialization`);
            console.table([...data_initialization.entries()].map(([key, v]) => [key, this.value_db.save_Value(v)]));
            console.groupEnd();
            console.group(`property`);
            console.table([...data_property.entries()].map(([key, v]) => [key, this.value_db.save_Value(v)]));
            console.groupEnd();
            console.groupEnd();
        }
    }
}

export class ClassLoader {
    private readonly class_db: ClassDataBase;
    private readonly value_db: ValueDataBase;

    private readonly instance_map: Map<RefId, { instance: ClassBase, property: { [key: string]: any } }> = new Map();

    constructor(class_db: ClassDataBase = ClassDB, value_db: ValueDataBase = ValueDB) {
        this.class_db = class_db;
        this.value_db = value_db;
    }

    public get_Instance(refid: RefId) {
        return this.instance_map.get(refid)?.instance;
    }

    private parse_Value(value: string) {
        return this.value_db.load_Value(value);
    }

    private parse_ValueItems(items: { [key: string]: string }) {
        const data: { [key: string]: string } = {};
        for (const [key, value] of Object.entries(items)) {
            const object = this.parse_Value(value);
            data[key] = object;
        }
        return data;
    }

    private parse_Instance(instance: LTTMClassDescriptorInstance) {
        const { type, refid, initialization, property } = instance;
        const refid_object: ClassRef = this.parse_Value(refid);
        const init = this.parse_ValueItems(initialization);
        const prop = this.parse_ValueItems(property);
        const class_instance = this.class_db.instantiate(type, new ClassReader(this, init));
        this.instance_map.set(refid_object.refid, { instance: class_instance, property: prop });
    }

    private load_InstanceProperty(instance: ClassBase, property: { [key: string]: any }) {
        instance.load(new ClassReader(this, property));
    }

    private parse_Json(json: string) {
        const obj = JSON.parse(json) as LTTMClassDescriptor;
        const { type, root, instances } = obj;
        const root_object: ClassRef = this.parse_Value(root);
        for (const instance of instances) {
            this.parse_Instance(instance);
        }
        for (const { instance, property } of this.instance_map.values()) {
            this.load_InstanceProperty(instance, property);
        }
        return this.get_Instance(root_object.refid);
    }

    public load<T extends ClassBase>(json: string): Result<T, Error> {
        this.instance_map.clear();
        try {
            const root = this.parse_Json(json);
            if (root === undefined) throw new Error('fail to load');
            return Result.Ok(root as T);
        }
        catch (err) {
            return Result.Error(err as Error);
        }
    }
}