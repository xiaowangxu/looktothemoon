import { GeometryResource } from "./GeometryResource";
import { RenderServer } from "../../render_server/RenderServer";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer, RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { Vector3, vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { type Vector2, vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { box3 } from "@/system/fivepebble/geometries/Box3";
import { Tau } from '@/system/fivepebble/Scalar';

export class BoxGeometryResource extends GeometryResource {
    protected _width: number = 1;
    protected _height: number = 1;
    protected _depth: number = 1;

    public get width() { return this._width; }
    public get height() { return this._height; }
    public get depth() { return this._depth; }

    public set width(width: number) {
        width = Math.max(width, 0);
        if (this._width !== width) {
            this._width = width;
            this.update_Geometry();
        }
    }
    public set height(height: number) {
        height = Math.max(height, 0);
        if (this._height !== height) {
            this._height = height;
            this.update_Geometry();
        }
    }
    public set depth(depth: number) {
        depth = Math.max(depth, 0);
        if (this._depth !== depth) {
            this._depth = depth;
            this.update_Geometry();
        }
    }

    constructor() {
        super();
        this.update_Geometry();
    }

    public set_Parameter(width?: number, height?: number, depth?: number) {
        let changed = false;
        if (width !== undefined) {
            width = Math.max(width, 0);
            if (this._width !== width) {
                changed ||= true;
                this._width = width;
            }
        }
        if (height !== undefined) {
            height = Math.max(height, 0);
            if (this._height !== height) {
                changed ||= true;
                this._height = height;
            }
        }
        if (depth !== undefined) {
            depth = Math.max(depth, 0);
            if (this._depth !== depth) {
                changed ||= true;
                this._depth = depth;
            }
        }
        if (changed) this.update_Geometry();
    }

    public update_Geometry() {
        const half_w = this.width / 2;
        const half_h = this.height / 2;
        const half_d = this.depth / 2;
        const position_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw,
            [
                // top
                vec3(half_w, half_h, half_d),
                vec3(half_w, half_h, -half_d),
                vec3(-half_w, half_h, half_d),
                vec3(-half_w, half_h, -half_d),
                // bottom
                vec3(half_w, -half_h, half_d),
                vec3(half_w, -half_h, -half_d),
                vec3(-half_w, -half_h, half_d),
                vec3(-half_w, -half_h, -half_d),
                // front
                vec3(half_w, -half_h, half_d),
                vec3(half_w, half_h, half_d),
                vec3(-half_w, -half_h, half_d),
                vec3(-half_w, half_h, half_d),
                // back
                vec3(half_w, -half_h, -half_d),
                vec3(half_w, half_h, -half_d),
                vec3(-half_w, -half_h, -half_d),
                vec3(-half_w, half_h, -half_d),
                // right
                vec3(half_w, -half_h, -half_d),
                vec3(half_w, half_h, -half_d),
                vec3(half_w, -half_h, half_d),
                vec3(half_w, half_h, half_d),
                // left
                vec3(-half_w, -half_h, -half_d),
                vec3(-half_w, half_h, -half_d),
                vec3(-half_w, -half_h, half_d),
                vec3(-half_w, half_h, half_d),
            ]);
        const normal_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw,
            [
                // top
                vec3(0, 1, 0),
                vec3(0, 1, 0),
                vec3(0, 1, 0),
                vec3(0, 1, 0),
                // bottom
                vec3(0, -1, 0),
                vec3(0, -1, 0),
                vec3(0, -1, 0),
                vec3(0, -1, 0),
                // front
                vec3(0, 0, 1),
                vec3(0, 0, 1),
                vec3(0, 0, 1),
                vec3(0, 0, 1),
                // back
                vec3(0, 0, -1),
                vec3(0, 0, -1),
                vec3(0, 0, -1),
                vec3(0, 0, -1),
                // right
                vec3(1, 0, 0),
                vec3(1, 0, 0),
                vec3(1, 0, 0),
                vec3(1, 0, 0),
                // left
                vec3(-1, 0, 0),
                vec3(-1, 0, 0),
                vec3(-1, 0, 0),
                vec3(-1, 0, 0),
            ]);
        const uv_buffer = new RenderDeviceVector2AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw,
            [
                // top
                vec2(1, 0),
                vec2(1, 1),
                vec2(0, 0),
                vec2(0, 1),
                // bottom
                vec2(1, 1),
                vec2(1, 0),
                vec2(0, 1),
                vec2(0, 0),
                // front
                vec2(1, 0),
                vec2(1, 1),
                vec2(0, 0),
                vec2(0, 1),
                // back
                vec2(1, 1),
                vec2(1, 0),
                vec2(0, 1),
                vec2(0, 0),
                // right
                vec2(1, 0),
                vec2(1, 1),
                vec2(0, 0),
                vec2(0, 1),
                // left
                vec2(0, 0),
                vec2(0, 1),
                vec2(1, 0),
                vec2(1, 1),
            ]);
        const index_buffer = new RenderDeviceIndexAttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw,
            [
                // top
                0, 1, 2, 2, 1, 3,
                // bottom
                4, 6, 5, 5, 6, 7,
                // front
                8, 9, 10, 10, 9, 11,
                // back
                12, 14, 13, 13, 14, 15,
                // right
                16, 17, 18, 18, 17, 19,
                // left
                20, 22, 21, 21, 22, 23,
            ]);
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: position_buffer,
                normal: normal_buffer,
                uv: uv_buffer,
            },
            index_buffer,
            36,
            box3(vec3(-half_w, -half_h, -half_d), vec3(half_w, half_h, half_d))
        );
        this.geometry.add_Surface(0 * index_buffer.per_element_byte_count, 6);
        this.geometry.add_Surface(6 * index_buffer.per_element_byte_count, 6);
        this.geometry.add_Surface(12 * index_buffer.per_element_byte_count, 6);
        this.geometry.add_Surface(18 * index_buffer.per_element_byte_count, 6);
        this.geometry.add_Surface(24 * index_buffer.per_element_byte_count, 6);
        this.geometry.add_Surface(30 * index_buffer.per_element_byte_count, 6);
    }
}

export class TorusGeometryResource extends GeometryResource {
    protected _radius: number = 1;
    protected _tube_radius: number = 0.25;
    protected _segments: number = 32;
    protected _tube_segments: number = 32;

    public get radius() { return this._radius; }
    public get tube_radius() { return this._tube_radius; }
    public get segments() { return this._segments; }
    public get tube_segments() { return this._tube_segments; }

    public set radius(radius: number) {
        radius = Math.max(radius, 0);
        if (this._radius !== radius) {
            this._radius = radius;
            this.update_Geometry();
        }
    }
    public set tube_radius(tube_radius: number) {
        tube_radius = Math.max(tube_radius, 0);
        if (this._tube_radius !== tube_radius) {
            this._tube_radius = tube_radius;
            this.update_Geometry();
        }
    }
    public set segments(segments: number) {
        segments = Math.max(Math.floor(segments), 3);
        if (this._segments !== segments) {
            this._segments = segments;
            this.update_Geometry();
        }
    }
    public set tube_segments(tube_segments: number) {
        tube_segments = Math.max(Math.floor(tube_segments), 3);
        if (this._tube_segments !== tube_segments) {
            this._tube_segments = tube_segments;
            this.update_Geometry();
        }
    }

    constructor() {
        super();
        this.update_Geometry();
    }

    public set_Parameter(radius?: number, tube_radius?: number, segments?: number, tube_segments?: number) {
        let changed = false;
        if (radius !== undefined) {
            radius = Math.max(radius, 0);
            if (this._radius !== radius) {
                changed ||= true;
                this._radius = radius;
            }
        }
        if (tube_radius !== undefined) {
            tube_radius = Math.max(tube_radius, 0);
            if (this._tube_radius !== tube_radius) {
                changed ||= true;
                this._tube_radius = tube_radius;
            }
        }
        if (segments !== undefined) {
            segments = Math.max(Math.floor(segments), 3);
            if (this._segments !== segments) {
                changed ||= true;
                this._segments = segments;
            }
        }
        if (tube_segments !== undefined) {
            tube_segments = Math.max(Math.floor(tube_segments), 3);
            if (this._tube_segments !== tube_segments) {
                changed ||= true;
                this._tube_segments = tube_segments;
            }
        }
        if (changed) this.update_Geometry();
    }

    public update_Geometry() {
        const radius = this.radius;
        const tube_radius = this.tube_radius;
        const segments = this.segments;
        const tube_segments = this.tube_segments;
        const arc = Tau;

        const vertex_count = (segments + 1) * (tube_segments + 1);

        const position_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);
        const normal_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);
        const uv_buffer = new RenderDeviceVector2AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);

        for (let j = 0; j <= segments; j++) {
            for (let i = 0; i <= tube_segments; i++) {
                const idx = j * (tube_segments + 1) + i;
                const u = i / tube_segments * arc;
                const v = j / segments * Math.PI * 2;
                // vertex
                const vertex = vec3(
                    (radius + tube_radius * Math.cos(v)) * Math.cos(u),
                    (radius + tube_radius * Math.cos(v)) * Math.sin(u),
                    tube_radius * Math.sin(v),
                );
                position_buffer.data[idx * 3 + 0] = vertex.x;
                position_buffer.data[idx * 3 + 1] = vertex.y;
                position_buffer.data[idx * 3 + 2] = vertex.z;
                // normal
                const center = vec3(radius * Math.cos(u), radius * Math.sin(u), 0);
                const normal = center.direction_to(vertex);
                normal_buffer.data[idx * 3 + 0] = normal.x;
                normal_buffer.data[idx * 3 + 1] = normal.y;
                normal_buffer.data[idx * 3 + 2] = normal.z;
                // uv
                uv_buffer.data[idx * 2 + 0] = i / tube_segments;
                uv_buffer.data[idx * 2 + 1] = j / segments;
            }
        }

        const index_count = segments * tube_segments * 6;

        const index_buffer = new RenderDeviceIndexAttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, index_count);

        // generate indices
        for (let j = 1; j <= segments; j++) {
            for (let i = 1; i <= tube_segments; i++) {
                const idx = (j - 1) * tube_segments + (i - 1);
                // indices
                const a = (tube_segments + 1) * j + i - 1;
                const b = (tube_segments + 1) * (j - 1) + i - 1;
                const c = (tube_segments + 1) * (j - 1) + i;
                const d = (tube_segments + 1) * j + i;
                // faces
                index_buffer.data[idx * 6 + 0] = a;
                index_buffer.data[idx * 6 + 1] = b;
                index_buffer.data[idx * 6 + 2] = d;
                index_buffer.data[idx * 6 + 3] = b;
                index_buffer.data[idx * 6 + 4] = c;
                index_buffer.data[idx * 6 + 5] = d;
            }
        }

        position_buffer.commit_Data();
        normal_buffer.commit_Data();
        uv_buffer.commit_Data();
        index_buffer.commit_Data();

        // build geometry

        const outer_radius = radius + tube_radius;

        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: position_buffer,
                normal: normal_buffer,
                uv: uv_buffer,
            },
            index_buffer,
            index_count,
            box3(
                vec3(-outer_radius, -outer_radius, -tube_radius),
                vec3(outer_radius, outer_radius, tube_radius),
            )
        );
    }
}

// export class SphereGeometryResource extends GeometryResource {
//     protected _radius: number = 1;
//     protected _width_segments: number = 32;
//     protected _height_Segments: number = 16;

//     public get radius() { return this._radius; }
//     public get width_segments() { return this._width_segments; }
//     public get height_Segments() { return this._height_Segments; }

//     public set radius(radius: number) {
//         radius = Math.max(radius, 0);
//         if (this._radius !== radius) {
//             this._radius = radius;
//             this.update_Geometry();
//         }
//     }
//     public set width_segments(width_segments: number) {
//         width_segments = Math.max(Math.floor(width_segments), 3);
//         if (this._width_segments !== width_segments) {
//             this._width_segments = width_segments;
//             this.update_Geometry();
//         }
//     }
//     public set height_Segments(height_Segments: number) {
//         height_Segments = Math.max(Math.floor(height_Segments), 2);
//         if (this._height_Segments !== height_Segments) {
//             this._height_Segments = height_Segments;
//             this.update_Geometry();
//         }
//     }

//     constructor() {
//         super();
//         this.update_Geometry();
//     }

//     public set_Parameter(radius?: number, width_segments?: number, height_Segments?: number) {
//         let changed = false;
//         if (radius !== undefined) {
//             radius = Math.max(radius, 0);
//             if (this._radius !== radius) {
//                 changed ||= true;
//                 this._radius = radius;
//             }
//         }
//         if (width_segments !== undefined) {
//             width_segments = Math.max(Math.floor(width_segments), 3);
//             if (this._width_segments !== width_segments) {
//                 changed ||= true;
//                 this._width_segments = width_segments;
//             }
//         }
//         if (height_Segments !== undefined) {
//             height_Segments = Math.max(Math.floor(height_Segments), 2);
//             if (this._height_Segments !== height_Segments) {
//                 changed ||= true;
//                 this._height_Segments = height_Segments;
//             }
//         }
//         if (changed) this.update_Geometry();
//     }

//     public update_Geometry() {
//         // const radius = this.radius;
//         // const width_segments = this.width_segments;
//         // const height_segments = this.height_Segments;
//         // const theta_start = 0;
//         // const theta_end = Math.PI;
//         // const theta_length = Math.PI;
//         // const phi_start = 0;
//         // const phi_length = Tau;

//         // // buffers

//         // const indices = [];
//         // const vertices = [];
//         // const normals = [];
//         // const uvs = [];

//         // // generate vertices, normals and uvs

//         // const vertex_count = (width_segments + 1) * (height_segments + 1);

//         // const position_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);
//         // const normal_buffer = new RenderDeviceVector3AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);
//         // const uv_buffer = new RenderDeviceVector2AttributeBuffer(RenderServer, RenderStateBufferUsage.StaticDraw, vertex_count);

//         // const vertex = new Vector3();

//         // for (let iy = 0; iy <= height_segments; iy++) {
//         //     const verticesRow = [];
//         //     const v = iy / height_segments;
//         //     // special case for the poles
//         //     let uOffset = 0;
//         //     if (iy === 0 && theta_start === 0) {
//         //         uOffset = 0.5 / width_segments;
//         //     } else if (iy === height_segments && theta_end === Math.PI) {
//         //         uOffset = - 0.5 / width_segments;
//         //     }
//         //     for (let ix = 0; ix <= width_segments; ix++) {
//         //         const idx = iy * (width_segments + 1) + ix;
//         //         const u = ix / width_segments;
//         //         vertex.set(
//         //             - radius * Math.cos(phi_start + u * phi_length) * Math.sin(theta_start + v * theta_length),
//         //             radius * Math.cos(theta_start + v * theta_length),
//         //             radius * Math.sin(phi_start + u * phi_length) * Math.sin(theta_start + v * theta_length)
//         //         );
//         //         // vertex
//         //         position_buffer.data[idx * 3 + 0] = vertex.x;
//         //         position_buffer.data[idx * 3 + 1] = vertex.y;
//         //         position_buffer.data[idx * 3 + 2] = vertex.z;
//         //         // normal
//         //         vertex.normalizes(vertex);
//         //         normal_buffer.data[idx * 3 + 0] = vertex.x;
//         //         normal_buffer.data[idx * 3 + 1] = vertex.y;
//         //         normal_buffer.data[idx * 3 + 2] = vertex.z;
//         //         // uv

//         //         uvs.push(u + uOffset, 1 - v);

//         //         verticesRow.push(index++);

//         //     }

//         //     grid.push(verticesRow);

//         // }

//         // // indices

//         // for (let iy = 0; iy < height_segments; iy++) {
//         //     for (let ix = 0; ix < width_segments; ix++) {
                
//         //         const a = grid[iy][ix + 1];
//         //         const b = grid[iy][ix];
//         //         const c = grid[iy + 1][ix];
//         //         const d = grid[iy + 1][ix + 1];

//         //         if (iy !== 0 || theta_start > 0) indices.push(a, b, d);
//         //         if (iy !== height_segments - 1 || theta_end < Math.PI) indices.push(b, c, d);

//         //     }

//         // }

//         // // build geometry

//         // this.setIndex(indices);
//         // this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
//         // this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
//         // this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

//     }
// }