import { Result } from "@/system/utils/Result";
import { ClassDecoder, ClassEncoder } from "./ClassEncoderDecoder";
import type { ClassExchangeData, ClassInstanceData, RefId } from "../ClassSaverLoader";
import type { ValueDatabase } from "../../databases/ValueDatabase";

type LTTMClassDescriptorInstance = {
    type: string,
    refid: RefId,
    unique?: boolean,
    external?: string,
    property?: { [key: string]: string },
}

type LTTMClassDescriptor = {
    type: 'LTTMClassDescriptor',
    meta: {
        date: string,
        version: string,
        author?: string,
    },
    root: RefId,
    instances: LTTMClassDescriptorInstance[],
}

const ClassSaverLoaderTypeName = 'LTTMClassDescriptor';
const ClassSaverLoaderVersion = '0.0.1';

type ClassJsonEncoderOption = { spaces?: string };

/**
 * @deprecated
 */
export class ClassJsonEncoder extends ClassEncoder<string, ClassJsonEncoderOption> {

    // options

    private spaces: string | undefined = undefined;

    constructor(value_db: ValueDatabase, data: ClassExchangeData, option?: ClassJsonEncoderOption) {
        super(value_db, data);
        // options
        this.spaces = option?.spaces;
    }

    public encode(): Result<string, Error> {
        const root_refid = this.data.root;// this.scope.root_refid;
        if (root_refid === undefined) return Result.Error(new Error('<ClassSaver> get_JsonString: no root instance to be saved'));
        const sorted = this.data.instances;
        const instances: LTTMClassDescriptorInstance[] = [];
        for (const { refid, type: class_name, unique, external: external_path, property: data_property } of sorted) {
            const instance_refid = refid;
            if (external_path === undefined) {
                const prop: { [key: string]: string } = {};
                const has_prop = data_property !== undefined && data_property.size > 0;
                if (has_prop) {
                    for (const [key, value] of data_property.entries()) {
                        prop[key] = this.value_db.save_Value(value);
                    }
                }
                instances.push({
                    type: class_name,
                    refid: instance_refid,
                    unique: unique,
                    property: has_prop ? prop : undefined,
                });
            }
            else {
                instances.push({
                    type: class_name,
                    refid: instance_refid,
                    unique: unique,
                    external: external_path,
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
            root: root_refid,
            instances
        };
        return Result.Ok(JSON.stringify(json, undefined, this.spaces));
    }
}

/**
 * @deprecated
 */
export class ClassJsonDecoder extends ClassDecoder<string, undefined> {
    public decode(): Result<ClassExchangeData, Error> {
        const json: LTTMClassDescriptor = JSON.parse(this.data);
        const instances: ClassInstanceData[] = [];
        const result: ClassExchangeData = {
            root: json.root,
            instances
        };
        for (const ins of json.instances) {
            const property = new Map<string, any>();
            if (ins.property !== undefined) {
                for (const [key, val] of Object.entries(ins.property)) {
                    property.set(key, this.value_db.load_Value(val));
                }
            }
            instances.push({
                type: ins.type,
                refid: ins.refid,
                external: ins.external,
                unique: ins.unique,
                property: property,
            });
        }
        return Result.Ok(result);
    }
}