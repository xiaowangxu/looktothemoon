import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { OffscreenRenderer3D } from "../OffscreenRenderer3D"
import { Renderer3DQueue } from "../Renderer3DQueue";
import { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { VisualWorld3D } from "@/system/engine/worlds/world3ds/VisualWorld3D";
import type { WebGL2RenderStateFrameBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import { Ref } from "@/system/utils/RefCounted";
import type { Config } from "@/system/engine/ConfiguredObject";
import { WebGL2RenderStateFrameBufferAttachmentPoint } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import { RenderServerShaderPass } from "@/system/engine/render_server/RenderServerShader";
import { RenderStateFrameBufferPart, RenderStateDataType } from "@/system/sliverofstraw/RenderState";
import { RenderServerMaterialCullFace } from "@/system/engine/render_server/RenderServerMaterial";

export class ShadowRenderer3D extends OffscreenRenderer3D {
    public render_queue: number = 0;
    public readonly _render_queue = new Renderer3DQueue();

    static readonly #frustum: Frustum3 = Frustum3.new;
    static readonly #size: Vector2 = Vector2.new;

    public readonly frame: Ref<WebGL2RenderStateFrameBuffer> = new Ref();

    constructor(config: Config) {
        super(config);
        this.frame.value = this.render_server.render_state.create_FrameBuffer().expect();
    }

    private set_CullFace(face: RenderServerMaterialCullFace) {
        switch (face) {
            case RenderServerMaterialCullFace.Back: {
                this.render_server.render_state.set_FaceWindingProxy(this.render_server.render_state.gl.CCW);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
                return;
            }
            case RenderServerMaterialCullFace.Front: {
                this.render_server.render_state.set_FaceWindingProxy(this.render_server.render_state.gl.CW);
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
                return;
            }
            case RenderServerMaterialCullFace.None: {
                this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, false);
                return;
            }
            default: {
                const n: never = face;
                return;
            }
        }
    }

    public render(world: VisualWorld3D, camera: Camera3, time: number, once: boolean): void {
        // if (this._render_pipeline.is_empty) return;

        // const pipeline = this._render_pipeline.expect;

        const cam = camera;
        const cam_world = cam.global_transform;
        const cam_projection = cam.projection;
        const cam_is_orthogonal = cam.is_orthogonal;
        const cam_frustum = cam.get_Frustum(ShadowRenderer3D.#frustum);
        const cam_mask = cam.mask;

        const width = 2048, height = 2048;
        const size = ShadowRenderer3D.#size.set(width, height);

        const frame = this.frame.expect;

        this.render_server.render_state.set_FrameBufferAttachment(frame, WebGL2RenderStateFrameBufferAttachmentPoint.Depth, world.shadows_texture.expect, undefined, 0);
        this.render_server.render_state.enable_FrameBuffer(frame);

        this.render_server.set_WorldUniforms(cam_world, cam_projection, cam_is_orthogonal, width, height, time, 1);

        const render_queue = this._render_queue;

        // fill up render queue
        let total_objects_count = 0;
        let rendered_objects_count = 0;
        this._render_queue.reset();
        for (const mesh of world.meshes) {
            total_objects_count++;
            if ((mesh.layer & cam_mask) === 0 || !mesh.cast_shadow || mesh.render_queue !== this.render_queue || !mesh.has_geometry) continue;
            if (mesh.fill_RenderQueue(render_queue, cam_frustum, cam, size)) rendered_objects_count++;
        }

        this.render_server.set_RenderCapabilities(true, true, this.render_server.render_state.gl.LEQUAL, false);
        this.render_server.render_state.set_ViewportProxy(0, 0, width, height);
        this.render_server.render_state.set_ScissorProxy(0, 0, width, height);
        this.render_server.render_state.set_CapabilityProxy(this.render_server.render_state.gl.CULL_FACE, true);
        this.render_server.render_state.set_ClearColorProxy(0, 0, 0, 0);
        this.render_server.render_state.clear_FrameBuffer(frame, RenderStateFrameBufferPart.Depth | RenderStateFrameBufferPart.Color);

        // render queue solid
        for (let i = 0; i <= render_queue.solid_pointer; i++) {
            const geometry = render_queue.solid_geometry_queue[i];
            const indexed = render_queue.solid_indexed_queue[i];
            const instance_count = render_queue.solid_instance_count_queue[i];
            const material = render_queue.solid_material_queue[i];
            const transform = render_queue.solid_transform_queue[i];
            const layer = render_queue.solid_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.PreZ);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_Uniform('model_world', transform);
                material.set_Uniform('layer', layer);
                material.commit_AllUniforms(RenderServerShaderPass.PreZ);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }
        for (let i = 0; i <= render_queue.transparent_pointer; i++) {
            const geometry = render_queue.transparent_geometry_queue[i];
            const indexed = render_queue.transparent_indexed_queue[i];
            const instance_count = render_queue.transparent_instance_count_queue[i];
            const material = render_queue.transparent_material_queue[i];
            const transform = render_queue.transparent_transform_queue[i];
            const layer = render_queue.transparent_layer_queue[i];
            if (material === undefined) continue;
            const program = material.get_Program(RenderServerShaderPass.PreZ);
            if (geometry !== undefined && program !== undefined) {
                this.set_CullFace(material.cull_face);
                material.set_Uniform('model_world', transform);
                material.set_Uniform('layer', layer);
                material.commit_AllUniforms(RenderServerShaderPass.PreZ);
                if (indexed) {
                    this.render_server.render_state.draw_Elements(program, geometry, RenderStateDataType.UnsignedInt, instance_count);
                }
                else {
                    this.render_server.render_state.draw_Arrays(program, geometry, instance_count);
                }
            }
        }

        if (once) {
            this._render_queue.clear();
        }
    }

    protected dispose(): void {
        this._render_queue.dispose();
        super.dispose();
    }
}