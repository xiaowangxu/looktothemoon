import { Ref, type Unrefed } from "@/system/utils/RefCounted";
import type { RenderStateBuffer } from "../../render_state/buffer/RenderStateBuffer";
import type { RenderStateTextureSampler } from "../../render_state/texture/RenderStateTextureSampler";
import type { RenderStateTextureView } from "../../render_state/texture/RenderStateTextureView";
import { RenderStateUniformGroup } from "../../render_state/uniform/RenderStateUniformGroup";
import { RenderStateUniformBindingType } from "../../render_state/uniform/RenderStateUniformLayout";
import type { WebGPURenderState } from "../WebGPURenderState";
import type { WebGPURenderStateTextureSampler } from "../texture/WebGPURenderStateTextureSampler";
import type { RenderStateObjectRefCounted } from "../../render_state/RenderStateObject";
import type { WebGPURenderStateBuffer } from "../buffer/WebGPURenderStateBuffer";
import type { WebGPURenderStateTextureView } from "../texture/WebGPURenderStateTextureView";

export type WebGPURenderStateUniformGroupEntry = { type: RenderStateUniformBindingType, binding: number };

interface WebGPURenderStateUniformGroupEntryGeneric<T extends RenderStateUniformBindingType, R extends RenderStateObjectRefCounted<WebGPURenderState>> extends GPUBindGroupEntry {
    type: T,
    ref: Ref<R>,
}

export type WebGPURenderStateUniformGroupResourceEntry =
    WebGPURenderStateUniformGroupEntryGeneric<RenderStateUniformBindingType.StorageBuffer, WebGPURenderStateBuffer> |
    WebGPURenderStateUniformGroupEntryGeneric<RenderStateUniformBindingType.Buffer, WebGPURenderStateBuffer> |
    WebGPURenderStateUniformGroupEntryGeneric<RenderStateUniformBindingType.Texture, WebGPURenderStateTextureView> |
    WebGPURenderStateUniformGroupEntryGeneric<RenderStateUniformBindingType.Sampler, WebGPURenderStateTextureSampler>;

export class WebGPURenderStateUniformGroup extends RenderStateUniformGroup<WebGPURenderState> {

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
        if (entry.type !== RenderStateUniformBindingType.StorageBuffer) throw new Error('<WebGPURenderStateUniformGroup> set_Storage: binding is not type of StorageBuffer');
        entry.ref.value = buffer;
        entry.resource = { buffer: buffer.buffer };
        this._binding_group = undefined;
    }

    public set_BufferUniform(binding: number, buffer: WebGPURenderStateBuffer): void {
        if (binding < 0 || binding >= this.entries.length) throw new Error('<WebGPURenderStateUniformGroup> set_BufferUniform: binding out of bound');
        const entry = this.entries[binding];
        if (entry.type !== RenderStateUniformBindingType.Buffer) throw new Error('<WebGPURenderStateUniformGroup> set_BufferUniform: binding is not type of Buffer');
        entry.ref.value = buffer;
        entry.resource = { buffer: buffer.buffer };
        this._binding_group = undefined;
    }

    public set_Texture(binding: number, texture_view: WebGPURenderStateTextureView): void {
        if (binding < 0 || binding >= this.entries.length) throw new Error('<WebGPURenderStateUniformGroup> set_Texture: binding out of bound');
        const entry = this.entries[binding];
        if (entry.type !== RenderStateUniformBindingType.Texture) throw new Error('<WebGPURenderStateUniformGroup> set_Texture: binding is not type of Texture');
        entry.ref.value = texture_view;
        entry.resource = texture_view.texture_view;
        this._binding_group = undefined;
    }

    public set_Sampler(binding: number, sampler: WebGPURenderStateTextureSampler): void {
        if (binding < 0 || binding >= this.entries.length) throw new Error('<WebGPURenderStateUniformGroup> set_Sampler: binding out of bound');
        const entry = this.entries[binding];
        if (entry.type !== RenderStateUniformBindingType.Sampler) throw new Error('<WebGPURenderStateUniformGroup> set_Sampler: binding is not type of Sampler');
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
        super.dispose();
    }
}