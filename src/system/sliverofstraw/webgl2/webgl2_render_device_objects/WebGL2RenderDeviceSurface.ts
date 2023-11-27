import { RenderDeviceSurface } from "../../render_device_objects/RenderDeviceSurface";
import type { RenderStateProgram } from "../../render_state_objects/RenderStateProgram";
import type { WebGL2RenderDevice } from "../WebGL2RenderDevice";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateBuffer, WebGL2RenderStateBufferView } from "../webgl2_render_state_objects/WebGL2RenderStateBuffer";
import type { WebGL2RenderStateProgram } from "../webgl2_render_state_objects/WebGL2RenderStateProgram";
import type { WebGL2RenderStateVertexArray } from "../webgl2_render_state_objects/WebGL2RenderStateVertexArray";

export class WebGL2RenderDeviceSurface extends RenderDeviceSurface<WebGL2RenderState, WebGL2RenderStateVertexArray> {
    constructor(render_device: WebGL2RenderDevice) {
        super(render_device);
    }

    public bound_Program(program: WebGL2RenderStateProgram) {
        const vertex_array = this.vertex_array_ref.expect as WebGL2RenderStateVertexArray;
        const rs = this.render_state;
        for (const [_, buffer_ref] of this.buffer_refs) {
            if (buffer_ref.location !== undefined) {
                rs.set_VertexArrayAttribute(vertex_array, buffer_ref.location, false);
            }
        }
        for (const [attribute, buffer_ref] of this.buffer_refs) {
            const attribute_location = rs.get_ProgramAttributeLocation(program, attribute);
            console.log(attribute, attribute_location);
            if (attribute_location < 0) {
                buffer_ref.location = undefined;
                continue;
            }
            if (buffer_ref.location === undefined || buffer_ref.location !== attribute_location) {
                const buffer = buffer_ref.buffer;
                rs.set_VertexArrayAttributeBuffer(vertex_array, attribute_location, (buffer.expect.buffer as WebGL2RenderStateBuffer | WebGL2RenderStateBufferView));
                rs.set_VertexArrayAttribute(vertex_array, attribute_location, true);
                buffer_ref.location = attribute_location;
            }
            else {
                rs.set_VertexArrayAttribute(vertex_array, attribute_location, true);
            }
        }
        this.changed = false;
    }
}