import { RenderDeviceObject } from "@/system/sliverofstraw/RenderDeviceObject";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { Ref } from "@/system/utils/RefCounted";

export class RenderServerVirtualTexture extends RenderDeviceObject<WebGL2RenderState> {

    private readonly texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();

    public dispose(): void {
        this.texture_ref.clear();
    }
}