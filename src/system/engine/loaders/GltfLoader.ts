// @ts-nocheck

import { Result } from "@/system/utils/Result";
import { Node } from "../nodes/Node";
import { Node3D } from "../nodes/node3ds/Node3D";
import { convert_DataURI_to_Buffer } from '@/system/utils/DataURIToBuffer';
import { type ColorSpace, Matrix4, Vector3, Quaternion, ClampToEdgeWrapping, MirroredRepeatWrapping, RepeatWrapping, NearestFilter, LinearFilter, NearestMipmapNearestFilter, LinearMipmapNearestFilter, NearestMipmapLinearFilter, LinearMipmapLinearFilter, ImageLoader, ImageBitmapLoader, Texture, BufferAttribute, InterleavedBuffer, InterleavedBufferAttribute, BufferGeometry, Color, LinearSRGBColorSpace, SRGBColorSpace, DoubleSide, Vector2, Material, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshInstance3D } from "../nodes/node3ds/visual_instance3ds/geometry_3ds/MeshInstance3D";
import { ThreeGeometryResource } from "../resources/resources/GeometryResource";
import { ThreeMaterialResource } from "../resources/resources/MaterialResource";

export class GltfLoader {
    private static readonly BinaryExtHeader = 'glTF';
    private static readonly BinaryExtHeaderLength = 12;
    private static readonly BinaryExtChunkTypeJson = 0x4E4F534A;
    private static readonly BinaryExtChunkTypeBin = 0x004E4942;

    private static decode_Binary(data: ArrayBuffer) {
        let content = undefined;
        let body = undefined;

        const headerView = new DataView(data, 0, GltfLoader.BinaryExtHeaderLength);
        const textDecoder = new TextDecoder();

        const header = {
            magic: textDecoder.decode(new Uint8Array(data.slice(0, 4))),
            version: headerView.getUint32(4, true),
            length: headerView.getUint32(8, true)
        };

        if (header.magic !== GltfLoader.BinaryExtHeader) {
            throw new Error('unsupported glTF-Binary header');
        }
        else if (header.version < 2.0) {
            throw new Error('legacy binary file detected');
        }

        const chunkContentsLength = header.length - GltfLoader.BinaryExtHeaderLength;
        const chunkView = new DataView(data, GltfLoader.BinaryExtHeaderLength);
        let chunkIndex = 0;

        while (chunkIndex < chunkContentsLength) {
            const chunkLength = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;
            const chunkType = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;
            if (chunkType === GltfLoader.BinaryExtChunkTypeJson) {
                const contentArray = new Uint8Array(data, GltfLoader.BinaryExtHeaderLength + chunkIndex, chunkLength);
                content = textDecoder.decode(contentArray);
            } else if (chunkType === GltfLoader.BinaryExtChunkTypeBin) {
                const byteOffset = GltfLoader.BinaryExtHeaderLength + chunkIndex;
                body = data.slice(byteOffset, byteOffset + chunkLength);
            }
            // clients must ignore chunks with unknown types.
            chunkIndex += chunkLength;
        }

        if (content === undefined) {
            throw new Error('content not found in .glb file');
        }

        if (body === undefined) {
            throw new Error('buffer not found in .glb file');
        }

        return { body, content };
    }

    public async parse(data: string | ArrayBuffer): Promise<Result<Node3D | undefined, Error>> {

        let json;
        let buffers: ArrayBuffer[] | undefined;

        if (typeof data === 'string') {
            try {
                json = JSON.parse(data);
                if (json.buffers && json.buffers.length > 0) {
                    buffers = [];
                    for (const { uri, byteLength } of json.buffers) {
                        const result = convert_DataURI_to_Buffer(uri);
                        const buffer = result.buffer;
                        const length = buffer.byteLength;
                        if (byteLength !== length) throw new Error('buffer length not match');
                        buffers.push(result.buffer);
                    }
                }
            }
            catch (err) { return Result.Error(new Error('can not parse string format')); }
        }
        else {
            const text_decoder = new TextDecoder();
            const magic = text_decoder.decode(new Uint8Array(data, 0, 4));
            if (magic === GltfLoader.BinaryExtHeader) {
                try {
                    const { body, content } = GltfLoader.decode_Binary(data);
                    json = JSON.parse(content);
                    buffers = [body];
                } catch (err) {
                    return Result.Error(new Error('can not parse data'));
                }
            } else {
                return Result.Error(new Error('unknown format'));
            }
        }

        console.log(json, buffers);

        if (json.asset === undefined || json.asset.version[0] < 2) {
            return Result.Error(new Error('unsupported asset, only glTF versions >= 2.0 are supported'));
        }

        if (buffers === undefined) {
            return Result.Error(new Error('unsupported buffer, only glTF with embeded buffers are supported'));
        }

        try {
            const parser = new GLTFParser(json, buffers);
            return Result.Ok(await parser.parse_Scene(0));
        }
        catch (err) {
            return Result.Error(new Error('failed to parse gltf file'));
        }

        return Result.Error(new Error());
    }
}

class GLTFParser {
    private static readonly Extensions: { [key: string]: string } = {
        KHR_BINARY_GLTF: 'KHR_binary_glTF',
        KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
        KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
        KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
        KHR_MATERIALS_IOR: 'KHR_materials_ior',
        KHR_MATERIALS_SHEEN: 'KHR_materials_sheen',
        KHR_MATERIALS_SPECULAR: 'KHR_materials_specular',
        KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
        KHR_MATERIALS_IRIDESCENCE: 'KHR_materials_iridescence',
        KHR_MATERIALS_ANISOTROPY: 'KHR_materials_anisotropy',
        KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
        KHR_MATERIALS_VOLUME: 'KHR_materials_volume',
        KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
        KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
        KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
        KHR_MATERIALS_EMISSIVE_STRENGTH: 'KHR_materials_emissive_strength',
        EXT_TEXTURE_WEBP: 'EXT_texture_webp',
        EXT_TEXTURE_AVIF: 'EXT_texture_avif',
        EXT_MESHOPT_COMPRESSION: 'EXT_meshopt_compression',
        EXT_MESH_GPU_INSTANCING: 'EXT_mesh_gpu_instancing'
    };
    private static readonly Attributes: { [key: string]: string } = {
        POSITION: 'position',
        NORMAL: 'normal',
        TANGENT: 'tangent',
        TEXCOORD_0: 'uv',
        TEXCOORD_1: 'uv1',
        TEXCOORD_2: 'uv2',
        TEXCOORD_3: 'uv3',
        COLOR_0: 'color',
        WEIGHTS_0: 'skinWeight',
        JOINTS_0: 'skinIndex',
    };
    private static readonly TypeSizes: { [key: string]: number } = {
        SCALAR: 1,
        VEC2: 2,
        VEC3: 3,
        VEC4: 4,
        MAT2: 4,
        MAT3: 9,
        MAT4: 16
    };
    private static readonly ComponentTypes: { [key: number]: any } = {
        5120: Int8Array,
        5121: Uint8Array,
        5122: Int16Array,
        5123: Uint16Array,
        5125: Uint32Array,
        5126: Float32Array
    };
    private static readonly AlphaModes: { [key: string]: string } = {
        OPAQUE: 'OPAQUE',
        MASK: 'MASK',
        BLEND: 'BLEND'
    };
    private static readonly FilterTypes: { [key: number]: any } = {
        9728: NearestFilter,
        9729: LinearFilter,
        9984: NearestMipmapNearestFilter,
        9985: LinearMipmapNearestFilter,
        9986: NearestMipmapLinearFilter,
        9987: LinearMipmapLinearFilter
    };
    private static readonly WrapModes: { [key: number]: any } = {
        33071: ClampToEdgeWrapping,
        33648: MirroredRepeatWrapping,
        10497: RepeatWrapping
    };


    private readonly json: any;
    private readonly buffers: ArrayBuffer[];

    private readonly accessor_cache: Map<number, any> = new Map();
    private readonly bufferview_cache: Map<number, ArrayBuffer> = new Map();
    private readonly buffer_cache: Map<number, any> = new Map();
    private readonly mesh_cache: Map<number, { geometry: BufferGeometry, materials: (number | undefined)[], single: boolean }> = new Map();
    private readonly material_cache: Map<number, Promise<Material>> = new Map();
    private readonly image_cache: Map<number, Promise<ImageBitmap>> = new Map();
    private readonly texture_cache: Map<number, Promise<Texture>> = new Map();

    public scene: Node | undefined = undefined;

    constructor(json = {}, buffers: ArrayBuffer[]) {
        this.json = json;
        this.buffers = buffers;
    }

    private parse_Buffer(index: number): ArrayBuffer {
        if (this.buffer_cache.has(index)) return this.buffer_cache.get(index)!;

        const buffer = this.json?.buffers?.[index];
        if (buffer === undefined) throw new Error('buffer not found');

        if (buffer.type && buffer.type !== 'arraybuffer') throw new Error('buffer type is not supported');

        // If present, GLB container is required to be the first buffer.
        if (buffer.uri === undefined && index === 0) {
            this.buffer_cache.set(index, this.buffers[0]);
            return this.buffers[0];
        }
        else {
            const buf = convert_DataURI_to_Buffer(buffer.uri).buffer;
            this.buffer_cache.set(index, buf);
            return buf;
        }
    }

    private parse_BufferView(index: number) {
        if (this.bufferview_cache.has(index)) return this.bufferview_cache.get(index)!;

        const buffer_view = this.json?.bufferViews?.[index];
        if (buffer_view === undefined) throw new Error('bufferView not found');

        const buffer = this.parse_Buffer(buffer_view.buffer);
        const byte_length = buffer_view.byteLength ?? 0;
        const byte_offset = buffer_view.byteOffset ?? 0;

        const buffer_slice = buffer.slice(byte_offset, byte_offset + byte_length);
        this.bufferview_cache.set(index, buffer_slice);

        return buffer_slice;
    }

    private parse_Accessor(index: number) {
        if (this.accessor_cache.has(index)) return this.accessor_cache.get(index)!;

        const accessor = this.json?.accessors?.[index];
        if (accessor === undefined) throw new Error('accessor not found');

        if (accessor.bufferView === undefined && accessor.sparse === undefined) {
            const item_size = GLTFParser.TypeSizes[accessor.type];
            const TypedArray = GLTFParser.ComponentTypes[accessor.componentType];
            const normalized = accessor.normalized === true;
            const array = new TypedArray(accessor.count * item_size);
            const attr = new BufferAttribute(array, item_size, normalized);
            this.accessor_cache.set(index, attr);
            return attr;
        }

        const buffer_views = [];
        if (accessor.bufferView !== undefined) {
            buffer_views.push(this.parse_BufferView(accessor.bufferView));
        }
        else {
            buffer_views.push(null);
        }

        if (accessor.sparse !== undefined) {
            buffer_views.push(this.parse_BufferView(accessor.sparse.indices.bufferView));
            buffer_views.push(this.parse_BufferView(accessor.sparse.values.bufferView));
        }

        const bufferView = buffer_views[0];

        const item_size = GLTFParser.TypeSizes[accessor.type];
        const TypedArray = GLTFParser.ComponentTypes[accessor.componentType];

        // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
        const element_bytes = TypedArray.BYTES_PER_ELEMENT;
        const itemBytes = element_bytes * item_size;
        const byte_offset = accessor.byteOffset ?? 0;
        const byte_stride = accessor.bufferView !== undefined ? this.json.bufferViews[accessor.bufferView].byteStride : undefined;
        const normalized = accessor.normalized === true;

        let array, buffer_attribute;

        // The buffer is not interleaved if the stride is the item size in bytes.
        if (byte_stride && byte_stride !== itemBytes) {
            // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
            // This makes sure that IBA.count reflects accessor.count properly
            const ibSlice = Math.floor(byte_offset / byte_stride);
            array = new TypedArray(bufferView, ibSlice * byte_stride, accessor.count * byte_stride / element_bytes);
            // Integer parameters to IB/IBA are in array elements, not bytes.
            const ib = new InterleavedBuffer(array, byte_stride / element_bytes);
            buffer_attribute = new InterleavedBufferAttribute(ib, item_size, (byte_offset % byte_stride) / element_bytes, normalized);
        }
        else {
            if (bufferView === null) {
                array = new TypedArray(accessor.count * item_size);
            }
            else {
                array = new TypedArray(bufferView, byte_offset, accessor.count * item_size);
            }
            buffer_attribute = new BufferAttribute(array, item_size, normalized);
        }

        // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
        if (accessor.sparse !== undefined) {

            const itemSizeIndices = GLTFParser.TypeSizes.SCALAR;
            const TypedArrayIndices = GLTFParser.ComponentTypes[accessor.sparse.indices.componentType];

            const byteOffsetIndices = accessor.sparse.indices.byteOffset ?? 0;
            const byteOffsetValues = accessor.sparse.values.byteOffset ?? 0;

            const sparseIndices = new TypedArrayIndices(buffer_views[1], byteOffsetIndices, accessor.sparse.count * itemSizeIndices);
            const sparseValues = new TypedArray(buffer_views[2], byteOffsetValues, accessor.sparse.count * item_size);

            if (bufferView !== null) {
                // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
                buffer_attribute = new BufferAttribute(buffer_attribute.array.slice(), buffer_attribute.itemSize, buffer_attribute.normalized);
            }

            for (let i = 0, il = sparseIndices.length; i < il; i++) {
                const index = sparseIndices[i];
                buffer_attribute.setX(index, sparseValues[i * item_size]);
                if (item_size >= 2) buffer_attribute.setY(index, sparseValues[i * item_size + 1]);
                if (item_size >= 3) buffer_attribute.setZ(index, sparseValues[i * item_size + 2]);
                if (item_size >= 4) buffer_attribute.setW(index, sparseValues[i * item_size + 3]);
                if (item_size >= 5) throw new Error('unsupported itemSize in sparse BufferAttribute');
            }
        }

        this.accessor_cache.set(index, buffer_attribute);

        return buffer_attribute;
    }

    private create_BufferGeometry(primitive: any): BufferGeometry {
        const buffer_geometry = new BufferGeometry();
        if (primitive.attributes === undefined) throw new Error('primitive does not has attributes');
        for (const attr_name in primitive.attributes) {
            const attr = GLTFParser.Attributes[attr_name];
            if (attr === undefined) continue;
            const accessor_index: number = primitive.attributes[attr_name];
            const buffer_attribute = this.parse_Accessor(accessor_index);
            buffer_geometry.setAttribute(attr, buffer_attribute);
        }
        if (primitive.indices !== undefined && !buffer_geometry.index) {
            const accessor = this.parse_Accessor(primitive.indices);
            buffer_geometry.setIndex(accessor);
        }
        return buffer_geometry;
    }

    private create_Geometry(primitives: any[]): { geometry: BufferGeometry, materials: (number | undefined)[], single: boolean } {
        const buffer_geometries: BufferGeometry[] = [];
        const materials: (number | undefined)[] = [];
        for (let i = 0, count = primitives.length; i < count; i++) {
            const primitive = primitives[i];
            if (primitive.extensions && primitive.extensions[GLTFParser.Extensions.KHR_DRACO_MESH_COMPRESSION]) throw new Error('DRACO geometry is not available');
            else {
                materials.push(primitive.material);
                buffer_geometries.push(this.create_BufferGeometry(primitive));
            }
        }
        if (buffer_geometries.length === 0) throw new Error('mesh has no primitives');
        if (buffer_geometries.length === 1) {
            buffer_geometries[0].computeBoundingBox();
            return { geometry: buffer_geometries[0], materials, single: primitives.length === 1 };
        }
        const result = mergeGeometries(buffer_geometries, true);
        result.computeBoundingBox();
        return { geometry: result, materials, single: primitives.length === 1 };
    }

    private parse_Image(index: number) {
        if (this.image_cache.has(index)) return this.image_cache.get(index)!;

        const image = this.json?.images?.[index];
        if (image === undefined) throw new Error('image not found');

        let buffer: ArrayBuffer | undefined = undefined;

        if (image.uri !== undefined) {
            buffer = convert_DataURI_to_Buffer(image.uri).buffer;
        }
        else if (image.bufferView !== undefined) {
            buffer = this.parse_BufferView(image.bufferView);
        }
        else {
            throw new Error('image is missing URI and bufferView');
        }

        if (buffer === undefined) throw new Error('image buffer is undefined');


        const url = URL.createObjectURL(new Blob([buffer], { type: image.mimeType }));
        const promise = new ImageBitmapLoader().loadAsync(url).catch(() => { throw new Error('can not load image'); });

        this.image_cache.set(index, promise);

        return promise;
    }

    private parse_Texture(index: number) {
        if (this.texture_cache.has(index)) return this.texture_cache.get(index)!;

        const texture = this.json?.textures?.[index];
        if (texture === undefined) throw new Error('texture not found');

        const texture_extensions = texture.extensions || {};

        if (texture_extensions[GLTFParser.Extensions.KHR_TEXTURE_BASISU] !== undefined) {
            throw new Error('KTX2 textures are currently not supported');
        }
        else if (texture_extensions[GLTFParser.Extensions.EXT_TEXTURE_AVIF] !== undefined) {
            throw new Error('AVIF textures are currently not supported');
        }
        else if (texture_extensions[GLTFParser.Extensions.EXT_TEXTURE_WEBP] !== undefined) {
            throw new Error('WEBP textures are currently not supported');
        }

        // load as png / jpge

        const image_promise = this.parse_Image(texture.source);
        const promise = image_promise.then((image) => {
            const tex = new Texture(image);
            tex.flipY = false;
            const samplers = this.json.samplers ?? [];
            const sampler = samplers[texture.sampler] ?? {};
            tex.magFilter = GLTFParser.FilterTypes[sampler.magFilter] ?? LinearFilter;
            tex.minFilter = GLTFParser.FilterTypes[sampler.minFilter] ?? LinearMipmapLinearFilter;
            tex.wrapS = GLTFParser.WrapModes[sampler.wrapS] ?? RepeatWrapping;
            tex.wrapT = GLTFParser.WrapModes[sampler.wrapT] ?? RepeatWrapping;
            tex.needsUpdate = true;
            return tex;
        }).catch(() => { throw new Error('can not parse texture') });

        this.texture_cache.set(index, promise);

        return promise;
    }

    private parse_Mesh(index: number) {
        if (this.mesh_cache.has(index)) return this.mesh_cache.get(index)!;

        const mesh = this.json?.meshes?.[index];
        if (mesh === undefined) throw new Error('mesh not found');

        const geometry = this.create_Geometry(mesh.primitives);
        this.mesh_cache.set(index, geometry);

        return geometry;
    }

    private extend_Texture(texture: Texture, transform: any) {
        if ((transform.texCoord === undefined || transform.texCoord === texture.channel)
            && transform.offset === undefined
            && transform.rotation === undefined
            && transform.scale === undefined) {
            // See https://github.com/mrdoob/three.js/issues/21819.
            return texture;
        }
        texture = texture.clone();
        if (transform.texCoord !== undefined) {
            texture.channel = transform.texCoord;
        }
        if (transform.offset !== undefined) {
            texture.offset.fromArray(transform.offset);
        }
        if (transform.rotation !== undefined) {
            texture.rotation = transform.rotation;
        }
        if (transform.scale !== undefined) {
            texture.repeat.fromArray(transform.scale);
        }
        texture.needsUpdate = true;
        return texture;
    }

    private parse_Material(index: number) {
        if (this.material_cache.has(index)) return this.material_cache.get(index)!;

        const material = this.json?.materials?.[index];
        if (material === undefined) throw new Error('material not found');

        let material_class: (new (param: any) => Material) | undefined = undefined;
        const material_params: any = {};
        const material_extensions = material.extensions || {};

        const promises = [];

        const assign_Texture = async (params: any, name: string, map: any, color_space: ColorSpace | undefined = undefined) => {
            let tex = await this.parse_Texture(map.index);
            if (map.texCoord !== undefined && map.texCoord > 0) {
                tex = tex.clone();
                tex.channel = map.texCoord;
            }
            const transform = map?.extensions?.[GLTFParser.Extensions.KHR_TEXTURE_TRANSFORM];
            if (transform !== undefined) {
                tex = this.extend_Texture(tex, transform);
            }
            if (color_space !== undefined) {
                tex.colorSpace = color_space;
            }
            params[name] = tex;
            return tex;
        };

        if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_UNLIT] !== undefined) {
            material_class = MeshBasicMaterial;
            material_params.color = new Color(1.0, 1.0, 1.0);
            material_params.opacity = 1.0;
            const metallicRoughness = material.pbrMetallicRoughness;
            if (metallicRoughness) {
                if (metallicRoughness.baseColorFactor instanceof Array) {
                    const array = metallicRoughness.baseColorFactor;
                    material_params.color.setRGB(array[0], array[1], array[2], LinearSRGBColorSpace);
                    material_params.opacity = array[3];
                }
                if (metallicRoughness.baseColorTexture !== undefined) {
                    // set albedo map
                    promises.push(assign_Texture(material_params, 'map', metallicRoughness.baseColorTexture, SRGBColorSpace));
                }
            }
        }
        else {
            // Specification:
            // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

            const metallic_roughness = material.pbrMetallicRoughness || {};

            material_class = MeshStandardMaterial;

            material_params.color = new Color(1.0, 1.0, 1.0);
            material_params.opacity = 1.0;

            if (metallic_roughness.baseColorFactor instanceof Array) {
                const array = metallic_roughness.baseColorFactor;
                material_params.color.setRGB(array[0], array[1], array[2], LinearSRGBColorSpace);
                material_params.opacity = array[3];
            }

            if (metallic_roughness.baseColorTexture !== undefined) {
                // set albedo map
                promises.push(assign_Texture(material_params, 'map', metallic_roughness.baseColorTexture, SRGBColorSpace));
            }

            material_params.metalness = metallic_roughness.metallicFactor ?? 1.0;
            material_params.roughness = metallic_roughness.roughnessFactor ?? 1.0;

            if (metallic_roughness.metallicRoughnessTexture !== undefined) {
                // set metalness map
                promises.push(assign_Texture(material_params, 'metalnessMap', metallic_roughness.metallicRoughnessTexture));
                // set roughness map
                promises.push(assign_Texture(material_params, 'roughnessMap', metallic_roughness.metallicRoughnessTexture));
            }

            if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_EMISSIVE_STRENGTH] !== undefined) {
                material_class = MeshPhysicalMaterial;
                const emissiveStrength = material.extensions[GLTFParser.Extensions.KHR_MATERIALS_EMISSIVE_STRENGTH].emissiveStrength;
                if (emissiveStrength !== undefined) material_params.emissiveIntensity = emissiveStrength;
            }
            else if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_CLEARCOAT] !== undefined) {
                material_class = MeshPhysicalMaterial;
                const extension = material_extensions[GLTFParser.Extensions.KHR_MATERIALS_CLEARCOAT];
                if (extension.clearcoatFactor !== undefined) material_params.clearcoat = extension.clearcoatFactor;
                if (extension.clearcoatTexture !== undefined) {
                    // set clearcoat map
                    promises.push(assign_Texture(material_params, 'clearcoatMap', extension.clearcoatTexture));
                }
                if (extension.clearcoatRoughnessFactor !== undefined) material_params.clearcoatRoughness = extension.clearcoatRoughnessFactor;
                if (extension.clearcoatRoughnessTexture !== undefined) {
                    // set clearcoatRoughness map
                    promises.push(assign_Texture(material_params, 'clearcoatRoughnessMap', extension.clearcoatRoughnessTexture));
                }
                if (extension.clearcoatNormalTexture !== undefined) {
                    // set clearcoatNormal map
                    promises.push(assign_Texture(material_params, 'clearcoatNormalMap', extension.clearcoatNormalTexture));
                    if (extension.clearcoatNormalTexture.scale !== undefined) {
                        const scale = extension.clearcoatNormalTexture.scale;
                        material_params.clearcoatNormalScale = new Vector2(scale, scale);
                    }
                }
            }
            else if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_SHEEN] !== undefined) {
                material_class = MeshPhysicalMaterial;
                material_params.sheenColor = new Color(0, 0, 0);
                material_params.sheenRoughness = 0;
                material_params.sheen = 1;
                const extension = material_extensions[GLTFParser.Extensions.KHR_MATERIALS_SHEEN];
                if (extension.sheenColorFactor !== undefined) {
                    const colorFactor = extension.sheenColorFactor;
                    material_params.sheenColor.setRGB(colorFactor[0], colorFactor[1], colorFactor[2], LinearSRGBColorSpace);
                }
                if (extension.sheenRoughnessFactor !== undefined) material_params.sheenRoughness = extension.sheenRoughnessFactor;
                if (extension.sheenColorTexture !== undefined) {
                    promises.push(assign_Texture(material_params, 'sheenColorMap', extension.sheenColorTexture, SRGBColorSpace));

                }
                if (extension.sheenRoughnessTexture !== undefined) {
                    promises.push(assign_Texture(material_params, 'sheenRoughnessMap', extension.sheenRoughnessTexture));
                }
            }
            else if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_TRANSMISSION] !== undefined) {
                material_class = MeshPhysicalMaterial;
                const extension = material_extensions[GLTFParser.Extensions.KHR_MATERIALS_TRANSMISSION];
                if (extension.transmissionFactor !== undefined) material_params.transmission = extension.transmissionFactor;
                if (extension.transmissionTexture !== undefined) {
                    promises.push(assign_Texture(material_params, 'transmissionMap', extension.transmissionTexture));
                }
            }
            else if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_VOLUME] !== undefined) {
                material_class = MeshPhysicalMaterial;
                const extension = material_extensions[GLTFParser.Extensions.KHR_MATERIALS_VOLUME];
                material_params.thickness = extension.thicknessFactor ?? 0;
                if (extension.thicknessTexture !== undefined) {
                    promises.push(assign_Texture(material_params, 'thicknessMap', extension.thicknessTexture));
                }
                material_params.attenuationDistance = extension.attenuationDistance ?? Infinity;
                const colorArray = extension.attenuationColor ?? [1, 1, 1];
                material_params.attenuationColor = new Color().setRGB(colorArray[0], colorArray[1], colorArray[2], LinearSRGBColorSpace);
            }
            else if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_IOR] !== undefined) {
                material_class = MeshPhysicalMaterial;
                const extension = material_extensions[GLTFParser.Extensions.KHR_MATERIALS_IOR];
                material_params.ior = extension.ior ?? 1.5;
            }
            else if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_SPECULAR] !== undefined) {
                material_class = MeshPhysicalMaterial;
                const extension = material_extensions[GLTFParser.Extensions.KHR_MATERIALS_SPECULAR];
                material_params.specularIntensity = extension.specularFactor !== undefined ? extension.specularFactor : 1.0;
                if (extension.specularTexture !== undefined) {
                    promises.push(assign_Texture(material_params, 'specularIntensityMap', extension.specularTexture));
                }
                const colorArray = extension.specularColorFactor ?? [1, 1, 1];
                material_params.specularColor = new Color().setRGB(colorArray[0], colorArray[1], colorArray[2], LinearSRGBColorSpace);
                if (extension.specularColorTexture !== undefined) {
                    promises.push(assign_Texture(material_params, 'specularColorMap', extension.specularColorTexture, SRGBColorSpace));
                }
            }
            else if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_ANISOTROPY] !== undefined) {
                material_class = MeshPhysicalMaterial;
                const extension = material_extensions[GLTFParser.Extensions.KHR_MATERIALS_ANISOTROPY];
                if (extension.anisotropyStrength !== undefined) material_params.anisotropy = extension.anisotropyStrength;
                if (extension.anisotropyRotation !== undefined) material_params.anisotropyRotation = extension.anisotropyRotation;
                if (extension.anisotropyTexture !== undefined) {
                    promises.push(assign_Texture(material_params, 'anisotropyMap', extension.anisotropyTexture));
                }
            }
            else if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_EMISSIVE_STRENGTH] !== undefined) {
                material_class = MeshPhysicalMaterial;
                const extension = material_extensions[GLTFParser.Extensions.KHR_MATERIALS_EMISSIVE_STRENGTH];
                if (extension.emissiveStrength !== undefined) material_params.emissiveIntensity = extension.emissiveStrength;
            }
            else if (material_extensions[GLTFParser.Extensions.KHR_MATERIALS_IRIDESCENCE] !== undefined) {
                material_class = MeshPhysicalMaterial;
                const extension = material_extensions[GLTFParser.Extensions.KHR_MATERIALS_IRIDESCENCE];
                if (extension.iridescenceFactor !== undefined) material_params.iridescence = extension.iridescenceFactor;
                if (extension.iridescenceTexture !== undefined) {
                    promises.push(assign_Texture(material_params, 'iridescenceMap', extension.iridescenceTexture));
                }
                if (extension.iridescenceIor !== undefined) material_params.iridescenceIOR = extension.iridescenceIor;
                if (material_params.iridescenceThicknessRange === undefined) material_params.iridescenceThicknessRange = [100, 400];
                if (extension.iridescenceThicknessMinimum !== undefined) material_params.iridescenceThicknessRange[0] = extension.iridescenceThicknessMinimum;
                if (extension.iridescenceThicknessMaximum !== undefined) material_params.iridescenceThicknessRange[1] = extension.iridescenceThicknessMaximum;
                if (extension.iridescenceThicknessTexture !== undefined) {
                    promises.push(assign_Texture(material_params, 'iridescenceThicknessMap', extension.iridescenceThicknessTexture));
                }
            }
        }

        if (material.doubleSided === true) material_params.side = DoubleSide;

        const alpha_mode = material.alphaMode ?? GLTFParser.AlphaModes.OPAQUE;
        if (alpha_mode === GLTFParser.AlphaModes.BLEND) {
            material_params.transparent = true;
            // See: https://github.com/mrdoob/three.js/issues/17706
            material_params.depthWrite = false;
        }
        else {
            material_params.transparent = false;
            if (alpha_mode === GLTFParser.AlphaModes.MASK) material_params.alphaTest = material.alphaCutoff ?? 0.5;
        }

        if (material.normalTexture !== undefined && material_class !== MeshBasicMaterial) {
            promises.push(assign_Texture(material_params, 'normalMap', material.normalTexture));
            material_params.normalScale = new Vector2(1, 1);
            if (material.normalTexture.scale !== undefined) {
                const scale = material.normalTexture.scale;
                material_params.normalScale.set(scale, scale);
            }
        }

        if (material.occlusionTexture !== undefined && material_class !== MeshBasicMaterial) {
            promises.push(assign_Texture(material_params, 'aoMap', material.occlusionTexture));
            if (material.occlusionTexture.strength !== undefined) material_params.aoMapIntensity = material.occlusionTexture.strength;
        }

        if (material.emissiveFactor !== undefined && material_class !== MeshBasicMaterial) {
            const emissive_factor = material.emissiveFactor;
            material_params.emissive = new Color().setRGB(emissive_factor[0], emissive_factor[1], emissive_factor[2], LinearSRGBColorSpace);
        }

        if (material.emissiveTexture !== undefined && material_class !== MeshBasicMaterial) {
            // set emissive Map
            promises.push(assign_Texture(material_params, 'emissiveMap', material.emissiveTexture, SRGBColorSpace));
        }

        if (material_class === undefined) throw new Error('material type unknown');

        // extra data / extensions are ignored

        const promise = Promise.all(promises).then(() => {
            const mat = new material_class!(material_params);
            if (material.name) mat.name = material.name;
            return mat;
        });

        this.material_cache.set(index, promise);

        return promise;
    }

    private parse_Node(index: number): Promise<Node3D> {
        const node = this.json?.nodes?.[index];
        if (node === undefined) throw new Error('node not found');

        const name = node.name;
        let matrix = new Matrix4();
        if (node.matrix !== undefined) {
            matrix.fromArray(node.matrix);
        }
        else {
            if (node.scale !== undefined) {
                const vec3 = new Vector3().fromArray(node.scale);
                matrix.multiply(new Matrix4().makeScale(vec3.x, vec3.y, vec3.z));
            }
            if (node.rotation !== undefined) {
                const quat = new Quaternion().fromArray(node.rotation);
                matrix.multiply(new Matrix4().makeRotationFromQuaternion(quat));
            }
            if (node.translation !== undefined) {
                const vec3 = new Vector3().fromArray(node.translation);
                matrix.multiply(new Matrix4().makeTranslation(vec3));
            }
        }

        const children: number[] = node.children ?? [];
        if (children.length > 0) {
            const subs = Promise.all(children.map(c => this.parse_Node(c)));
            return subs.then(ss => {
                const node3d = new Node3D();
                for (const s of ss) {
                    node3d.add_Child(s);
                }
                if (name !== undefined) node3d.name = name;
                node3d.local_transform = matrix;
                return node3d;
            });
        }
        else if (node.mesh !== undefined) {
            const { geometry, materials, single } = this.parse_Mesh(node.mesh);
            const mats = Promise.all(materials.map(m => m === undefined ? Promise.resolve(undefined) : this.parse_Material(m)));
            return mats.then(ms => {
                const mesh_instance = new MeshInstance3D();
                mesh_instance.geometry = new ThreeGeometryResource(geometry);
                if (single && ms[0] !== undefined) {
                    mesh_instance.material = new ThreeMaterialResource(ms[0]);
                }
                else {
                    mesh_instance.material = ms.map(m => m === undefined ? undefined : new ThreeMaterialResource(m));
                }
                if (name !== undefined) mesh_instance.name = name;
                mesh_instance.local_transform = matrix;
                return mesh_instance;
            });
        }

        const node3d = new Node3D();
        if (name !== undefined) node3d.name = name;
        node3d.local_transform = matrix;
        return Promise.resolve(node3d);
    }

    public parse_Scene(index: number) {
        const scene = this.json?.scenes?.[index];
        if (scene === undefined) throw new Error('scene not found');

        const name = scene.name;
        const nodes: Promise<Node3D>[] = (scene.nodes ?? []).map((n: number) => this.parse_Node(n));

        console.warn(nodes);

        if (nodes.length === 0) return Promise.resolve(undefined);
        if (nodes.length === 1) return nodes[0].then((n) => {
            if (name !== undefined) n.name = name;
            return n;
        });

        const root = new Node3D();
        if (name !== undefined) root.name = name;

        return Promise.all(nodes).then((ns) => {
            for (const n of ns) {
                root.add_Child(n);
            }
            return root;
        });
    }
}