import { RenderDeviceSurface } from "../../render_device_objects/RenderDeviceSurface";
import type { WebGL2RenderDevice } from "../WebGL2RenderDevice";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateProgram } from "../webgl2_render_state_objects/WebGL2RenderStateProgram";
import type { WebGL2RenderStateVertexArray } from "../webgl2_render_state_objects/WebGL2RenderStateVertexArray";

export class WebGL2RenderDeviceSurface extends RenderDeviceSurface<WebGL2RenderState, WebGL2RenderStateVertexArray> {
    private bound_vertex_shader_id: number = -1;

    constructor(render_device: WebGL2RenderDevice) {
        super(render_device);
    }

    public bound_Program(program: WebGL2RenderStateProgram) {
        const vertex_shader_id = program.vert_shader_ref.expect.id;
        if (vertex_shader_id === this.bound_vertex_shader_id) return;
        const vertex_array = this.vertex_array_ref.expect as WebGL2RenderStateVertexArray;
        const rs = this.render_state;
        for (const [_, buffer_ref] of this.buffer_refs) {
            if (buffer_ref.location !== undefined) {
                buffer_ref.buffer.expect.toggle_VertexArray(vertex_array, buffer_ref.location, false);
            }
        }
        for (const [attribute, buffer_ref] of this.buffer_refs) {
            const attribute_location = rs.get_ProgramAttributeLocation(program, attribute);
            const buffer = buffer_ref.buffer;
            if (attribute_location < 0) {
                buffer_ref.location = undefined;
                continue;
            }
            if (buffer_ref.location === undefined || buffer_ref.location !== attribute_location) {
                buffer.expect.toggle_VertexArray(vertex_array, attribute_location, true);
                buffer.expect.bound_VertexArray(vertex_array, attribute_location);
                buffer_ref.location = attribute_location;
            }
            else {
                buffer.expect.toggle_VertexArray(vertex_array, attribute_location, true);
            }
        }
        this.bound_vertex_shader_id = vertex_shader_id;
        this.changed = false;
    }
}