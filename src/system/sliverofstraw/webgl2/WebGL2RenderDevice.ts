import { RenderDevice, type RenderDeviceCanvas, type RenderDeviceInitOption } from "../RenderDevice";
import { WebGL2RenderState, type WebGL2RenderStateInitOption } from "./WebGL2RenderState";

export interface WebGL2RenderDeviceInitOption extends RenderDeviceInitOption, WebGL2RenderStateInitOption { }

export class WebGL2RenderDevice extends RenderDevice<WebGL2RenderState, WebGL2RenderDeviceInitOption> {
    constructor(canvas: RenderDeviceCanvas, option: WebGL2RenderDeviceInitOption) {
        super(canvas, WebGL2RenderState, option);
    }

    public dispose(): void {}
}