import { Ref } from "@/system/utils/RefCounted";
import type { WebGPURenderState } from "../../WebGPURenderState";
import type { WebGPURenderStateTextureSampler } from "../texture/WebGPURenderStateTextureSampler";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateBuffer } from "../buffer/WebGPURenderStateBuffer";
import type { WebGPURenderStateTextureView } from "../texture/WebGPURenderStateTextureView";
import { WebGPURenderStateUniformBindingType } from "./WebGPURenderStateUniformLayout";
import type { WebGPURenderStateBufferView } from "../buffer/WebGPURenderStateBufferView";

export type WebGPURenderStateUniformGroupEntry = { type: WebGPURenderStateUniformBindingType, binding: number };

interface WebGPURenderStateUniformGroupEntryGeneric<T extends WebGPURenderStateUniformBindingType, R extends WebGPURenderObjectRefCounted> extends GPUBindGroupEntry {
    type: T,
    ref: Ref<R>,
}

export type WebGPURenderStateUniformGroupResourceEntry =
    WebGPURenderStateUniformGroupEntryGeneric<WebGPURenderStateUniformBindingType.StorageBuffer, WebGPURenderStateBuffer | WebGPURenderStateBufferView> |
    WebGPURenderStateUniformGroupEntryGeneric<WebGPURenderStateUniformBindingType.Buffer, WebGPURenderStateBuffer | WebGPURenderStateBufferView> |
    WebGPURenderStateUniformGroupEntryGeneric<WebGPURenderStateUniformBindingType.Texture, WebGPURenderStateTextureView> |
    WebGPURenderStateUniformGroupEntryGeneric<WebGPURenderStateUniformBindingType.Sampler, WebGPURenderStateTextureSampler>;

export class WebGPURenderStateUniformGroup extends WebGPURenderObjectRefCounted {

    protected readonly binding_layout: GPUBindGroupLayout;

    protected readonly entries: WebGPURenderStateUniformGroupResourceEntry[] = [];

    protected _binding_group: GPUBindGroup | undefined;
    public get binding_group() { return this.flush(); }

    constructor(render_state: WebGPURenderState, binding_layout: GPUBindGroupLayout, entries: WebGPURenderStateUniformGroupEntry[]) {
        super(render_state);
        this.binding_layout = binding_layout;
        for (const entry of entries) {
            this.entries.push({
                type: entry.type,
                binding: entry.binding,
                resource: undefined!,
                ref: new Ref<any>(),
            })
        }
    }

    public set_Storage(binding: number, buffer: WebGPURenderStateBuffer): void {
        if (binding < 0 || binding >= this.entries.length) throw new Error('<WebGPURenderStateUniformGroup> set_Storage: binding out of bound');
        const entry = this.entries[binding];
        if (entry.type !== WebGPURenderStateUniformBindingType.StorageBuffer) throw new Error('<WebGPURenderStateUniformGroup> set_Storage: binding is not type of StorageBuffer');
        if (entry.ref.value === buffer) return;
        entry.ref.value = buffer;
        entry.resource = { buffer: buffer.buffer, offset: buffer.offset, size: buffer.length };
        this._binding_group = undefined;
    }

    public set_BufferUniform(binding: number, buffer: WebGPURenderStateBuffer | WebGPURenderStateBufferView): void {
        if (binding < 0 || binding >= this.entries.length) throw new Error('<WebGPURenderStateUniformGroup> set_BufferUniform: binding out of bound');
        const entry = this.entries[binding];
        if (entry.type !== WebGPURenderStateUniformBindingType.Buffer) throw new Error('<WebGPURenderStateUniformGroup> set_BufferUniform: binding is not type of Buffer');
        if (entry.ref.value === buffer) return;
        entry.ref.value = buffer;
        entry.resource = { buffer: buffer.buffer, offset: buffer.offset, size: buffer.length };
        this._binding_group = undefined;
    }

    public set_Texture(binding: number, texture_view: WebGPURenderStateTextureView): void {
        if (binding < 0 || binding >= this.entries.length) throw new Error('<WebGPURenderStateUniformGroup> set_Texture: binding out of bound');
        const entry = this.entries[binding];
        if (entry.type !== WebGPURenderStateUniformBindingType.Texture) throw new Error('<WebGPURenderStateUniformGroup> set_Texture: binding is not type of Texture');
        if (entry.ref.value === texture_view) return;
        entry.ref.value = texture_view;
        entry.resource = texture_view.texture_view;
        this._binding_group = undefined;
    }

    public set_Sampler(binding: number, sampler: WebGPURenderStateTextureSampler): void {
        if (binding < 0 || binding >= this.entries.length) throw new Error('<WebGPURenderStateUniformGroup> set_Sampler: binding out of bound');
        const entry = this.entries[binding];
        if (entry.type !== WebGPURenderStateUniformBindingType.Sampler) throw new Error('<WebGPURenderStateUniformGroup> set_Sampler: binding is not type of Sampler');
        if (entry.ref.value === sampler) return;
        entry.ref.value = sampler;
        entry.resource = sampler.sampler;
        this._binding_group = undefined;
    }

    public flush() {
        if (this._binding_group === undefined) {
            this._binding_group = this.render_state.device.createBindGroup({ layout: this.binding_layout, entries: this.entries });
        }
        return this._binding_group;
    }

    public dispose(): void {
        for (const entry of this.entries) {
            entry.ref.clear();
        }
        this.render_state.delete_UniformGroup(this);
    }
}