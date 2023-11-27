import { RenderDeviceRenderableSurface } from "../../render_device_objects/RenderDeviceRenderableSurface";
import type { WebGL2RenderDevice } from "../WebGL2RenderDevice";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateVertexArray } from "../webgl2_render_state_objects/WebGL2RenderStateVertexArray";
import type { WebGL2RenderDeviceMaterial } from "./WebGL2RenderDeviceMaterial";
import type { WebGL2RenderDeviceSurface } from "./WebGL2RenderDeviceSurface";

export class WebGL2RenderDeviceRenderableSurface extends RenderDeviceRenderableSurface<WebGL2RenderState, WebGL2RenderDeviceMaterial, WebGL2RenderDeviceSurface> {
    constructor(render_device: WebGL2RenderDevice) {
        super(render_device);
    }

    public render(): void {
        const material = this.material_ref.expect;
        const surface = this.surface_ref.expect;
        const program = material.program;
        const vertex_array = surface.vertex_array;
        if (this.material_changed || this.surface_changed || surface.changed) {
            console.log(">>>>> update program / surface");
            (surface as WebGL2RenderDeviceSurface).bound_Program(program);
            this.surface_changed = false;
            this.material_changed = false;
        }
        if (program !== undefined && vertex_array !== undefined) {
            const rs = this.render_state;
            // set cap
            const { depth_test } = material;
            rs.set_CapabilityProxy(rs.gl.DEPTH_TEST, depth_test);
            // set uniforms
            if (surface.indexed) {
                rs.drawElements(program, vertex_array, surface.index_type);
            }
            else {
                rs.drawArrays(program, vertex_array);
            }
        }
    }
}