/**
 * Description: A THREE loader for STL ASCII files, as created by Solidworks and other CAD programs.
 *
 * Supports both binary and ASCII encoded files, with automatic detection of type.
 *
 * The loader returns a non-indexed buffer geometry.
 *
 * Limitations:
 *  Binary decoding supports "Magics" color format (http://en.wikipedia.org/wiki/STL_(file_format)#Color_in_binary_STL).
 *  There is perhaps some question as to how valid it is to always assume little-endian-ness.
 *  ASCII decoding assumes file is UTF-8.
 *
 * Usage:
 *  const loader = new STLLoader();
 *  loader.load( './models/stl/slotted_disk.stl', function ( geometry ) {
 *    scene.add( new THREE.Mesh( geometry ) );
 *  });
 *
 * For binary STLs geometry might contain colors for vertices. To use it:
 *  // use the same code to load STL as above
 *  if (geometry.hasColors) {
 *    material = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: true });
 *  } else { .... }
 *  const mesh = new THREE.Mesh( geometry, material );
 *
 * For ASCII STLs containing multiple solids, each solid is assigned to a different group.
 * Groups can be used to assign a different color by defining an array of materials with the same length of
 * geometry.groups and passing it to the Mesh constructor:
 *
 * const mesh = new THREE.Mesh( geometry, material );
 *
 * For example:
 *
 *  const materials = [];
 *  const nGeometryGroups = geometry.groups.length;
 *
 *  const colorMap = ...; // Some logic to index colors.
 *
 *  for (let i = 0; i < nGeometryGroups; i++) {
 *
 *		const material = new THREE.MeshPhongMaterial({
 *			color: colorMap[i],
 *			wireframe: false
 *		});
 *
 *  }
 *
 *  materials.push(material);
 *  const mesh = new THREE.Mesh(geometry, materials);
 */

import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Result } from "@/system/utils/Result";
import { ClassSaver } from "../classes/saver_loader/ClassSaverLoader";
import { RenderStatePrimitiveType, RenderStateBufferUsage } from "@/system/sliverofstraw/RenderState";
import { PackedVector3Array, PackedVector2Array, PackedIndexArray, PackedVector4Array } from "../classes/value_wrappers/PackedArray";
import { ArrayGeometryResource } from "../resources/geometry_resources/ArrayGeometryResource";
import { Box3 } from "@/system/fivepebble/geometries/Box3";

export class StlLoader {

    static #tmp_vector3_0 = Vector3.new;

    protected static parse_Binary(data: ArrayBuffer): { position: PackedVector3Array, normal: PackedVector3Array, color?: PackedVector4Array | undefined, bbox: Box3 } {
        const reader = new DataView(data);
        const faces_count = reader.getUint32(80, true);

        // let r: number, g: number, b: number;
        // let has_colors = false;

        // let defaultR: number = 1, defaultG: number = 1, defaultB: number = 1, alpha: number = 1;

        // process STL header
        // check for default color in header ("COLOR=rgba" sequence).

        // for (let index = 0; index < 80 - 10; index++) {
        //     if ((reader.getUint32(index, false) == 0x434F4C4F /*COLO*/) && (reader.getUint8(index + 4) == 0x52 /*'R'*/) && (reader.getUint8(index + 5) == 0x3D /*'='*/)) {
        //         has_colors = true;
        //         defaultR = reader.getUint8(index + 6) / 255;
        //         defaultG = reader.getUint8(index + 7) / 255;
        //         defaultB = reader.getUint8(index + 8) / 255;
        //         alpha = reader.getUint8(index + 9) / 255;
        //     }
        // }

        const dataOffset = 84;
        const faceLength = 12 * 4 + 2;
        const vertices = new PackedVector3Array(faces_count * 3);
        const normals = new PackedVector3Array(faces_count * 3);
        // const colors = new PackedVector4Array(faces_count * 3);

        const vector3_0 = StlLoader.#tmp_vector3_0;

        const bbox_min = Vector3.create(+Infinity, +Infinity, +Infinity);
        const bbox_max = Vector3.create(-Infinity, -Infinity, -Infinity);

        for (let face = 0; face < faces_count; face++) {
            const start = dataOffset + face * faceLength;
            const normalX = reader.getFloat32(start, true);
            const normalY = reader.getFloat32(start + 4, true);
            const normalZ = reader.getFloat32(start + 8, true);
            // if (has_colors) {
            //     const packedColor = reader.getUint16(start + 48, true);
            //     if ((packedColor & 0x8000) === 0) {
            //         // facet has its own unique color
            //         r = (packedColor & 0x1F) / 31;
            //         g = ((packedColor >> 5) & 0x1F) / 31;
            //         b = ((packedColor >> 10) & 0x1F) / 31;
            //     }
            //     else {
            //         r = defaultR;
            //         g = defaultG;
            //         b = defaultB;
            //     }
            // }
            for (let i = 1; i <= 3; i++) {
                const vertexstart = start + i * 12;
                vector3_0.x = reader.getFloat32(vertexstart, true);
                vector3_0.y = reader.getFloat32(vertexstart + 4, true);
                vector3_0.z = reader.getFloat32(vertexstart + 8, true);
                bbox_min.min(bbox_min, vector3_0);
                bbox_max.max(bbox_max, vector3_0);
                vertices.update_Data(vector3_0, face * 3 + i - 1);
                vector3_0.x = normalX;
                vector3_0.y = normalY;
                vector3_0.z = normalZ;
                normals.update_Data(vector3_0, face * 3 + i - 1);
                // if (has_colors) {
                //     color.set(r, g, b).convertSRGBToLinear();
                //     colors[componentIdx] = color.r;
                //     colors[componentIdx + 1] = color.g;
                //     colors[componentIdx + 2] = color.b;
                // }
            }
        }

        return { position: vertices, normal: normals, color: undefined, bbox: Box3.create(bbox_min, bbox_max) };
    }

    protected static parse_Ascii(data: string): { position: PackedVector3Array, normal: PackedVector3Array, color?: PackedVector4Array | undefined, bbox: Box3 } {

        const patternSolid = /solid([\s\S]*?)endsolid/g;
        const patternFace = /facet([\s\S]*?)endfacet/g;
        const patternName = /solid\s(.+)/;
        let faceCounter = 0;

        const patternFloat = /[\s]+([+-]?(?:\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?)/.source;
        const patternVertex = new RegExp('vertex' + patternFloat + patternFloat + patternFloat, 'g');
        const patternNormal = new RegExp('normal' + patternFloat + patternFloat + patternFloat, 'g');

        const vertices = [];
        const normals = [];
        const groupNames = [];

        const normal = new Vector3();

        let result;

        let groupCount = 0;
        let startVertex = 0;
        let endVertex = 0;

        while ((result = patternSolid.exec(data)) !== null) {

            startVertex = endVertex;

            const solid = result[0];

            const name = (result = patternName.exec(solid)) !== null ? result[1] : '';
            groupNames.push(name);

            while ((result = patternFace.exec(solid)) !== null) {
                let vertexCountPerFace = 0;
                let normalCountPerFace = 0;
                const text = result[0];
                while ((result = patternNormal.exec(text)) !== null) {
                    normal.x = parseFloat(result[1]);
                    normal.y = parseFloat(result[2]);
                    normal.z = parseFloat(result[3]);
                    normalCountPerFace++;
                }
                while ((result = patternVertex.exec(text)) !== null) {
                    vertices.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
                    normals.push(normal.x, normal.y, normal.z);
                    vertexCountPerFace++;
                    endVertex++;
                }
                // every face have to own ONE valid normal
                if (normalCountPerFace !== 1) {
                    console.error('THREE.STLLoader: Something isn\'t right with the normal of face number ' + faceCounter);
                }
                // each face have to own THREE valid vertices
                if (vertexCountPerFace !== 3) {
                    console.error('THREE.STLLoader: Something isn\'t right with the vertices of face number ' + faceCounter);
                }
                faceCounter++;
            }

            const start = startVertex;
            const count = endVertex - startVertex;

            geometry.userData.groupNames = groupNames;

            geometry.addGroup(start, count, groupCount);
            groupCount++;

        }

        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));

        return geometry;

    }

    protected static match_DataViewAt(query: number[], reader: DataView, offset: number) {
        // Check if each byte in query matches the corresponding byte from the current offset
        for (let i = 0, il = query.length; i < il; i++) {
            if (query[i] !== reader.getUint8(offset + i)) return false;
        }
        return true;
    }

    protected static is_Binary(data: ArrayBuffer | string) {
        if (typeof data === 'string') return false;
        const reader = new DataView(data);
        const face_size = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8);
        const n_faces = reader.getUint32(80, true);
        const expect = 80 + (32 / 8) + (n_faces * face_size);
        if (expect === reader.byteLength) {
            return true;
        }
        // An ASCII STL data must begin with 'solid ' as the first six bytes.
        // However, ASCII STLs lacking the SPACE after the 'd' are known to be
        // plentiful.  So, check the first 5 bytes for 'solid'.
        // Several encodings, such as UTF-8, precede the text with up to 5 bytes:
        // https://en.wikipedia.org/wiki/Byte_order_mark#Byte_order_marks_by_encoding
        // Search for "solid" to start anywhere after those prefixes.
        // US-ASCII ordinal values for 's', 'o', 'l', 'i', 'd'
        const solid = [115, 111, 108, 105, 100];
        for (let off = 0; off < 5; off++) {
            // If "solid" text is matched to the current offset, declare it to be an ASCII STL.
            if (StlLoader.match_DataViewAt(solid, reader, off)) return false;
        }
        // Couldn't find "solid" text at the beginning; it is binary STL.
        return true;
    }

    protected static ensure_Binary(data: ArrayBuffer | string) {
        if (typeof data === 'string') {
            const array_buffer = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                array_buffer[i] = data.charCodeAt(i) & 0xff;
            }
            return array_buffer.buffer || array_buffer;
        }
        else {
            return data;
        }
    }

    protected static ensure_Ascii(data: ArrayBuffer | string) {
        if (typeof data !== 'string') {
            return new TextDecoder().decode(data);
        }
        return data;
    }

    parse(data: ArrayBuffer | string): Result<ClassSaver, Error> {
        try {
            const binary = StlLoader.ensure_Binary(data);
            const { position, normal, color, bbox } = StlLoader.is_Binary(binary) ? StlLoader.parse_Binary(binary) : StlLoader.parse_Ascii(StlLoader.ensure_Ascii(data));
            const class_saver = new ClassSaver();
            const refid = ArrayGeometryResource.dump_Data(
                class_saver,
                0,
                RenderStatePrimitiveType.Triangles,
                {
                    position: position,
                    normal: normal,
                    color: color,
                },
                undefined,
                position.element_count,
                RenderStateBufferUsage.StaticDraw,
                bbox,
                undefined, undefined, undefined
            );
            class_saver.set_Root(refid);
            return Result.Ok(class_saver);
        }
        catch (err) {
            return Result.Error(new Error(`<StlLoader> parse: fail to parse stl, ${err}`));
        }
    }
}