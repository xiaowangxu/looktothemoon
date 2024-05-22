import { ReadonlyRef, Ref } from "@/system/utils/RefCounted";
import { RenderServerMaterial } from "../../render_server/material/RenderServerMaterial";
import { Resource } from "../Resource";
import type { WebGPURenderStateCullMode } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import type { WebGPURenderStateUniformGroup } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformGroup";
import type { TextureResource } from "../texture_resources/TextureResource";
import { RenderServer, type RenderServerDefaultTextureType } from "../../render_server/RenderServer";
import type { Disposable } from "@/system/utils/Type";
import type { WebGPURenderStateTextureSampler } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";

export abstract class MaterialResource extends Resource {

    protected readonly render_server_material_ref: ReadonlyRef<RenderServerMaterial> = new ReadonlyRef(new RenderServerMaterial());
    public get render_server_material() { return this.render_server_material_ref.expect; }

    public get cull_mode() { return this.render_server_material.cull_mode; }
    public set cull_mode(cull_mode: WebGPURenderStateCullMode) { this.render_server_material.cull_mode = cull_mode; }

    public get depth_bias() { return this.render_server_material.depth_bias; }
    public set depth_bias(depth_bias: number) { this.render_server_material.depth_bias = depth_bias; }

    public get depth_bias_slope_scale() { return this.render_server_material.depth_bias_slope_scale; }
    public set depth_bias_slope_scale(depth_bias_slope_scale: number) { this.render_server_material.depth_bias_slope_scale = depth_bias_slope_scale; }

    protected static set_UniformGroupTexture(uniform_group: WebGPURenderStateUniformGroup, binding: number, texture: TextureResource | undefined, fallback: RenderServerDefaultTextureType) {
        uniform_group.set_Texture(binding, texture?.render_server_texture?.texture_view_ref?.expect ?? RenderServer.get_DefaultTexture(fallback).texture_view_ref.expect);
    }

    protected dispose(): void {
        this.render_server_material_ref.clear();
        super.dispose();
    }
}

export class MaterialTextureStorage<T extends TextureResource = TextureResource> implements Disposable {

    private readonly uniform_group_ref: ReadonlyRef<WebGPURenderStateUniformGroup>;

    private readonly texture_ref: Ref<T> = new Ref();
    private readonly texture_binding: number;
    private readonly texture_fallback: RenderServerDefaultTextureType;

    public get is_empty() { return this.texture_ref.is_empty; }

    private readonly sampler_ref: ReadonlyRef<WebGPURenderStateTextureSampler> | undefined;
    private readonly sampler_binding: number | undefined;

    constructor(uniform_group: WebGPURenderStateUniformGroup, texture_binding: number, texture: T | undefined = undefined, texture_fallback: RenderServerDefaultTextureType, sampler_binding?: number, sampler?: WebGPURenderStateTextureSampler) {
        this.uniform_group_ref = new ReadonlyRef(uniform_group);

        this.texture_ref.value = texture;
        this.texture_binding = texture_binding;
        this.texture_fallback = texture_fallback;

        this.sampler_binding = sampler_binding;
        this.sampler_ref = sampler === undefined ? undefined : new ReadonlyRef(sampler);
        if (this.sampler_binding !== undefined && this.sampler_ref !== undefined) {
            this.uniform_group_ref.expect.set_Sampler(this.sampler_binding, this.sampler_ref.expect);
        }

        this.update();
    }

    private readonly update_func = () => { this.update(); }
    private update() {
        this.uniform_group_ref.expect.set_Texture(this.texture_binding, this.texture_ref.value?.render_server_texture.texture_view_ref.expect ?? RenderServer.get_DefaultTexture(this.texture_fallback).texture_view_ref.expect);
    }

    public get() {
        return this.texture_ref.value;
    }

    /**
     * @returns return true if texture changed
     */
    public set(texture: T | undefined) {
        if (texture === this.texture_ref.value) return false;
        this.texture_ref.value?.signal_changed.disconnect(this.update_func);
        this.texture_ref.value = texture;
        this.texture_ref.value?.signal_changed.connect(this.update_func);
        this.update();
        return true;
    }

    public dispose() {
        this.texture_ref.clear();
        this.sampler_ref?.clear();
        this.uniform_group_ref.clear();
    }
}