import { Box3 } from '@/system/fivepebble/geometries/Box3';
import { Vector3 } from '@/system/fivepebble/linear_algebra/Vector3';
import { Result } from '@/system/utils/Result';
import { ClassSaver } from '../classes/saver_loader/ClassSaverLoader';
import { ArrayGeometryResource } from '../resources/geometry_resources/ArrayGeometryResource';
import { RenderStateBufferUsage, RenderStatePrimitiveType } from '@/system/sliverofstraw/RenderState';
import { PackedIndexArray, PackedVector2Array, PackedVector3Array } from '../classes/value_wrappers/PackedArray';

const WHITESPACE_RE = /\s+/;

export class ObjLoader {
    public positions: number[] = [];
    public normals: number[] = [];
    public uvs: number[] = [];
    public indices: number[] = [];

    public bbox: Box3 = Box3.new;

    private init() {
        this.positions = [];
        this.normals = [];
        this.uvs = [];
        this.indices = [];
    }

    static readonly #face_vertex: [string, string, string] = ['', '', ''];

    private *triangulate(elements: string[]) {
        if (elements.length <= 3) {
            yield elements;
        } else if (elements.length === 4) {
            ObjLoader.#face_vertex[0] = elements[0];
            ObjLoader.#face_vertex[1] = elements[1];
            ObjLoader.#face_vertex[2] = elements[2];
            yield ObjLoader.#face_vertex;
            ObjLoader.#face_vertex[0] = elements[2];
            ObjLoader.#face_vertex[1] = elements[3];
            ObjLoader.#face_vertex[2] = elements[0];
            yield ObjLoader.#face_vertex;
        } else {
            for (let i = 1; i < elements.length - 1; i++) {
                ObjLoader.#face_vertex[0] = elements[0];
                ObjLoader.#face_vertex[1] = elements[i];
                ObjLoader.#face_vertex[2] = elements[i + 1];
                yield ObjLoader.#face_vertex;
            }
        }
    }

    static readonly #vector3: Vector3 = new Vector3();

    public parse(data: string): Result<ClassSaver, Error> {
        this.init();

        // datas
        const all_vertices = [];
        const all_normals = [];
        const all_uvs = [];

        const face_vertex_hash: Record<string, number> = {};

        let first_vertex: boolean = true;
        let index = 0;
        const lines = data.split("\n");

        for (let line of lines) {
            line = line.trim();
            // is empty or a comment line
            if (!line || line.startsWith("#")) continue;
            const elements = line.split(WHITESPACE_RE);
            const type = elements.shift();
            // # List of geometric vertices, with (x, y, z, [w]) coordinates, w is optional and defaults to 1.0.
            // v 0.123 0.234 0.345 1.0
            if (type === 'v') {
                // we will ignore the w component
                const x = parseFloat(elements[0]);
                const y = parseFloat(elements[1]);
                const z = parseFloat(elements[2]);
                all_vertices.push(x, y, z);
            }
            // # List of vertex normals in (x,y,z) form; normals might not be unit vectors.
            // vn 0.707 0.000 0.707
            else if (type === 'vn') {
                // if this is a vertex normal
                const x = parseFloat(elements[0]);
                const y = parseFloat(elements[1]);
                const z = parseFloat(elements[2]);
                all_normals.push(x, y, z);
            }
            // # List of texture coordinates, in (u, [v, w]) coordinates, these will vary between 0 and 1. v, w are optional and default to 0.
            // vt 0.500 1 [0]
            else if (type === 'vt') {
                // we will ignore the w component
                const u = parseFloat(elements[0]);
                const v = elements[1] === undefined ? 0 : parseFloat(elements[1]);
                all_uvs.push(u, v);
            }
            // # Polygonal face element (see below)
            // f v1 v2 v3 [...vn]
            // f v/vt ...
            // f v/vt/vn ...
            // f v//vn ...
            else if (type === 'f') {
                for (const triangle of this.triangulate(elements)) {
                    for (let j = 0, len = triangle.length; j < len; j++) {
                        const face_vertex = triangle[j];
                        if (face_vertex in face_vertex_hash) {
                            this.indices.push(face_vertex_hash[face_vertex]);
                        }
                        else {
                            const vertex = face_vertex.split("/");
                            let position = undefined, normal = undefined, uv = undefined;
                            if (vertex.length === 3 && vertex[1] === '') {
                                // is v//vn
                                position = parseInt(vertex[0]) - 1;
                                normal = parseInt(vertex[2]) - 1;
                            }
                            else {
                                position = parseInt(vertex[0]) - 1;
                                uv = parseInt(vertex[1]) - 1;
                                normal = parseInt(vertex[2]) - 1;
                            }
                            // Vertex position
                            {
                                const idx = position * 3;
                                const x = all_vertices[idx + 0];
                                const y = all_vertices[idx + 1];
                                const z = all_vertices[idx + 2];
                                this.positions.push(x, y, z);
                                if (first_vertex) {
                                    this.bbox.min.set(x, y, z);
                                    this.bbox.max.set(x, y, z);
                                    first_vertex = false;
                                }
                                else {
                                    ObjLoader.#vector3.set(x, y, z);
                                    this.bbox.min.min(this.bbox.min, ObjLoader.#vector3);
                                    this.bbox.max.max(this.bbox.max, ObjLoader.#vector3);
                                }
                            }
                            // Vertex textures
                            if (uv !== undefined && all_uvs.length > 0) {
                                const idx = uv * 2;
                                this.uvs.push(all_uvs[idx + 0]);
                                this.uvs.push(all_uvs[idx + 1]);
                            }
                            // Vertex normals
                            if (normal !== undefined && all_normals.length > 0) {
                                const idx = normal * 3;
                                this.normals.push(all_normals[idx + 0]);
                                this.normals.push(all_normals[idx + 1]);
                                this.normals.push(all_normals[idx + 2]);
                            }
                            // add the newly created Vertex to the list of indices
                            face_vertex_hash[face_vertex] = index;
                            this.indices.push(index);
                            // increment the counter
                            index += 1;
                        }
                    }
                }
            }
        }

        const class_saver = new ClassSaver();
        const refid = ArrayGeometryResource.dump_Data(
            class_saver,
            0,
            RenderStatePrimitiveType.Triangles,
            {
                position: this.positions.length > 0 ? new PackedVector3Array(new Float32Array(this.positions)) : undefined,
                normal: this.normals.length > 0 ? new PackedVector3Array(new Float32Array(this.normals)) : undefined,
                uv: this.uvs.length > 0 ? new PackedVector2Array(new Float32Array(this.uvs)) : undefined,
            },
            this.indices.length > 0 ? new PackedIndexArray(new Uint32Array(this.indices)) : undefined,
            this.indices.length,
            RenderStateBufferUsage.StaticDraw,
            this.bbox,
            undefined, undefined, undefined
        );
        class_saver.set_Root(refid);

        return Result.Ok(class_saver);
    }
}