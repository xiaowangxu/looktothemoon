import type { Texture } from "./Texture";

export enum AttributeUniformType {
    Int, Float, Vec2, Vec3, Vec4, Mat3, Mat4, Sample2D
}

type UniformDataType = ArrayBufferLike | number[] | Texture;

export class Uniforms {
    private readonly uniforms_map: Map<string, { type: AttributeUniformType, location: WebGLUniformLocation | null, value: UniformDataType | undefined }> = new Map();

    *[Symbol.iterator]() {
        for (const [name, { location, type, value }] of this.uniforms_map) {
            if (location === null) continue;
            yield { name, type, location, value };
        }
        return;
    }

    constructor() { }

    public get names() { return this.uniforms_map.keys(); }

    public add_Uniform(name: string, type: AttributeUniformType, value: UniformDataType | undefined) {
        this.uniforms_map.set(name, { type, location: null, value });
        return this;
    }

    public set_Location(name: string, location: WebGLUniformLocation) {
        if (this.uniforms_map.has(name)) {
            this.uniforms_map.get(name)!.location = location;
        }
    }

    public get_Location(name: string) {
        if (this.uniforms_map.has(name)) {
            return this.uniforms_map.get(name)!.location;
        }
        return null;
    }

    public get_Value(name: string) {
        if (this.uniforms_map.has(name)) {
            return this.uniforms_map.get(name)!.value;
        }
        return undefined;
    }

    public clear() {
        this.uniforms_map.clear();
    }

    public clear_Locations() {
        for (const uniform of this.uniforms_map.values()) {
            uniform.location = null;
        }
    }
}

export class Attributes {
    private readonly attributes_map: Map<string, { type: AttributeUniformType, location: number }> = new Map();

    constructor() { }

    public get names() { return [...this.attributes_map.keys()]; }

    public add_Attribute(name: string, type: AttributeUniformType) {
        this.attributes_map.set(name, { type, location: -1 });
        return this;
    }

    public set_Location(name: string, location: number) {
        if (this.attributes_map.has(name)) {
            this.attributes_map.get(name)!.location = location;
        }
    }

    public get_Location(name: string) {
        if (this.attributes_map.has(name)) {
            return this.attributes_map.get(name)!.location;
        }
        return null;
    }

    public clear() {
        this.attributes_map.clear();
    }

    public clear_Locations() {
        for (const uniform of this.attributes_map.values()) {
            uniform.location = -1;
        }
    }
}