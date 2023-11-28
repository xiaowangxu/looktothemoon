import { RenderDeviceMaterialSet } from "../../render_device_objects/RenderDeviceMaterialSet";
import type { WebGL2RenderDevice } from "../WebGL2RenderDevice";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateProgram } from "../webgl2_render_state_objects/WebGL2RenderStateProgram";
import type { WebGL2RenderStateShader } from "../webgl2_render_state_objects/WebGL2RenderStateShader";

export class WebGL2RenderDeviceMaterialSet extends RenderDeviceMaterialSet<WebGL2RenderState, WebGL2RenderStateProgram> {
    public depth_test: boolean = true;

    constructor(render_device: WebGL2RenderDevice, vertex: WebGL2RenderStateShader, fragments_set: { [name: string]: WebGL2RenderStateShader }) {
        super(render_device, vertex, fragments_set);
    }
}