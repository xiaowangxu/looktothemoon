import { RenderDeviceMaterial } from "../../render_device_objects/RenderDeviceMaterial";
import type { WebGL2RenderDevice } from "../WebGL2RenderDevice";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateProgram } from "../webgl2_render_state_objects/WebGL2RenderStateProgram";

export class WebGL2RenderDeviceMaterial extends RenderDeviceMaterial<WebGL2RenderState, WebGL2RenderStateProgram> {
    public depth_test: boolean = true;

    constructor(render_device: WebGL2RenderDevice, program: WebGL2RenderStateProgram) {
        super(render_device, program);
    }
}