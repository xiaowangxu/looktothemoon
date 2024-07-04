import { Result } from "@/system/utils/Result";
import { Resource, ResourceInstanceCache } from "../Resource";
import { ClassLoader, ClassSaver, type ClassExchangeData, type ClassInstancePropertyMap, type RefId } from "../../classes/saver_loader/ClassSaverLoader";
import type { Node } from "../../nodes/Node";
import type { ClassReader, ClassWriter } from "../../classes/saver_loader/ClassWriterReader";
import { BigUint } from "../../classes/value_wrappers/BigInt";
import type { ClassDatabase } from "../../classes/class_database/ClassDatabase";

export class PackedSceneResource extends Resource {

    public static class_name: string = 'PackedSceneResource';

    protected scene_class_exchange_data: ClassExchangeData | undefined;
    protected parents_map: Map<RefId, RefId> = new Map();

    public instantiate<T extends Node>(resource_instance_cache: ResourceInstanceCache, class_db?: ClassDatabase): Result<T, Error> {
        if (this.scene_class_exchange_data === undefined) return Result.Error(new Error(`<PackedSceneResource> instantiate: packed scene is empty or does not has a root node`));
        
        const class_loader = new ClassLoader(resource_instance_cache, class_db)
        const parse = class_loader.parse_Data(this.scene_class_exchange_data, undefined, undefined);
        if (parse.failed) return Result.Error(parse.expect_Error());

        for (const [node_refid, parent_refid] of this.parents_map) {
            const node = class_loader.get_Instance<Node>(node_refid);
            const parent = class_loader.get_Instance<Node>(parent_refid);
            if (node === undefined || parent === undefined) return Result.Error(new Error(`<PackedSceneResource> instantiate: node or its parent not found`));
            parent.add_Child(node);
        }

        const root = class_loader.get_Instance<T>(this.scene_class_exchange_data.root);
        if (root === undefined) return Result.Error(new Error(`<PackedSceneResource> instantiate: packed scene does not has a root node`));

        return Result.Ok(root);
    }

    private walk_Nodes(class_saver: ClassSaver, node: Node, parent_refid: RefId | undefined = undefined): Result<RefId, Error> {
        const result = class_saver.add_Instance(node, false);
        if (result.failed) return Result.Error(result.expect_Error());

        const refid = result.expect();
        for (const child of node.children) {
            const res = this.walk_Nodes(class_saver, child, refid);
            if (res.failed) return Result.Error(res.expect_Error());
            
            this.parents_map.set(res.expect(), refid);
        }

        return Result.Ok(refid);
    }

    public parse(node: Node): Result<undefined, Error> {
        this.scene_class_exchange_data = undefined;
        this.parents_map.clear();

        const class_saver = new ClassSaver();
        const walk_result = this.walk_Nodes(class_saver, node);
        if (walk_result.failed) return Result.Error(walk_result.expect_Error());

        const data = class_saver.get_Data(false);
        if (data.failed) return Result.Error(data.expect_Error());

        this.scene_class_exchange_data = data.expect();
        this.scene_class_exchange_data.root = walk_result.expect();
        this.scene_class_exchange_data.uid = class_saver.get_InstanceData(this.scene_class_exchange_data.root)!.uid;

        return Result.Ok(undefined);
    }

    public dump(writer: ClassWriter): void {
        if (this.scene_class_exchange_data === undefined) throw new Error('<PackedSceneResource> dump: packed scene is empty or does not has a root node');
        writer.property('root', this.scene_class_exchange_data.root);
        writer.property('parents_map', this.parents_map);
        const instances: Map<string, any>[] = [];
        for (const { type, refid, property, uid, external, unique } of this.scene_class_exchange_data.instances) {
            const entries: [string, any][] = [
                ['type', type],
                ['refid', refid],
                ['uid', new BigUint(uid)],
            ];
            if (property !== undefined) entries.push(['property', property]);
            if (external !== undefined) entries.push(['external', external]);
            if (unique !== undefined) entries.push(['unique', unique]);
            const map = new Map<string, any>(entries);
            instances.push(map);
        }
        writer.property('instances', instances);
    }

    public load(reader: ClassReader): void {
        const root = reader.get<RefId>('root');
        if (root === undefined) throw new Error(`<PackedSceneResource> load: PackedScene's data is not complete`);
        const parents_map = reader.get<Map<RefId, RefId>>('parents_map');
        if (parents_map === undefined) throw new Error(`<PackedSceneResource> load: PackedScene's data is not complete`);
        this.parents_map = parents_map;
        const instances = reader.get<Map<string, any>[]>('instances');
        if (instances === undefined) throw new Error(`<PackedSceneResource> load: PackedScene's data is not complete`);
        const exchange_data: ClassExchangeData = {
            root,
            uid: -1n,
            instances: [],
            meta: undefined,
        };
        for (const instance of instances) {
            const type = instance.get('type') as string | undefined;
            const refid = instance.get('refid') as RefId | undefined;
            const uid = instance.get('uid') as bigint | undefined;
            if (type === undefined || refid === undefined || uid === undefined) throw new Error(`<PackedSceneResource> load: PackedScene's data is not complete`);
            if (refid === root) exchange_data.uid = uid;
            const property = instance.get('property') as ClassInstancePropertyMap | undefined;
            const external = instance.get('external') as string | undefined;
            const unique = instance.get('unique') as boolean | undefined;
            exchange_data.instances.push({
                type,
                refid,
                unique,
                external,
                uid,
                property,
            });
        }
        if (exchange_data.uid === -1n) throw new Error(`<PackedSceneResource> load: PackedScene's data is not complete`);
        this.scene_class_exchange_data = exchange_data;
    }

}