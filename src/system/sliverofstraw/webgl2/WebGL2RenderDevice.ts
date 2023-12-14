import { Ref } from "@/system/utils/RefCounted";
import { RenderDevice, type RDCanvas, type RenderDeviceInitOption } from "../RenderDevice";
import { WebGL2RenderState, type WebGL2RenderStateInitOption } from "./WebGL2RenderState";
import { RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStateShaderType, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType, type RenderStateInitOption, RenderStateTextureDataFormat } from "../RenderState";
import type { WebGL2RenderStateBuffer } from "./webgl2_render_state_objects/WebGL2RenderStateBuffer";
import { process_WebGL2ShaderCode } from "./WebGL2ShaderProcessor";
import type { WebGL2RenderStateTexture } from "./webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Deg2Rad, Rad2Ded } from "@/system/fivepebble/Scalar";

export interface WebGL2RenderDeviceInitOption extends RenderDeviceInitOption, WebGL2RenderStateInitOption { }


export class WebGL2RenderDevice extends RenderDevice<WebGL2RenderState, WebGL2RenderDeviceInitOption> {
    constructor(canvas: RDCanvas, option: WebGL2RenderDeviceInitOption) {
        super(canvas, WebGL2RenderState, option);
    }

    public dispose(): void {}
}