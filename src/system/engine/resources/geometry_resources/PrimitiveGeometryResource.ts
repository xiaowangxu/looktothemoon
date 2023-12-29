import { GeometryResource } from "./GeometryResource";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer, RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { box3 } from "@/system/fivepebble/geometries/Box3";
import { Tau } from '@/system/fivepebble/Scalar';
import type { ClassReader, ClassWriter } from "../../classes/ClassWriterReader";

export abstract class PrimitiveGeometryResource extends GeometryResource {
	public abstract build(): void;
}

export class BoxGeometryResource extends PrimitiveGeometryResource {
	public static class_name: string = 'BoxGeometryResource';

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
		}
	}
	public set height(height: number) {
		height = Math.max(height, 0);
		if (this._height !== height) {
			this._height = height;
		}
	}
	public set depth(depth: number) {
		depth = Math.max(depth, 0);
		if (this._depth !== depth) {
			this._depth = depth;
		}
	}

	public build() {
		const half_w = this.width / 2;
		const half_h = this.height / 2;
		const half_d = this.depth / 2;
		const position_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw,
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
		const normal_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw,
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
		const uv_buffer = new RenderDeviceVector2AttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw,
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
		const index_buffer = new RenderDeviceIndexAttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw,
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

	// save / load

	public dump(writer: ClassWriter): void {
		writer.property('width', this.width);
		writer.property('height', this.height);
		writer.property('depth', this.depth);
	}

	public load(reader: ClassReader): void {
		this.width = reader.get<number>('width') ?? 1;
		this.height = reader.get<number>('height') ?? 1;
		this.depth = reader.get<number>('depth') ?? 1;
		this.build();
	}
}

export class TorusGeometryResource extends PrimitiveGeometryResource {
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
		}
	}
	public set tube_radius(tube_radius: number) {
		tube_radius = Math.max(tube_radius, 0);
		if (this._tube_radius !== tube_radius) {
			this._tube_radius = tube_radius;
		}
	}
	public set segments(segments: number) {
		segments = Math.max(Math.floor(segments), 3);
		if (this._segments !== segments) {
			this._segments = segments;
		}
	}
	public set tube_segments(tube_segments: number) {
		tube_segments = Math.max(Math.floor(tube_segments), 3);
		if (this._tube_segments !== tube_segments) {
			this._tube_segments = tube_segments;
		}
	}

	public build() {
		const radius = this.radius;
		const tube_radius = this.tube_radius;
		const segments = this.segments;
		const tube_segments = this.tube_segments;
		const arc = Tau;

		const vertex_count = (segments + 1) * (tube_segments + 1);

		const position_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw, vertex_count);
		const normal_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw, vertex_count);
		const uv_buffer = new RenderDeviceVector2AttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw, vertex_count);

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

		const index_buffer = new RenderDeviceIndexAttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw, index_count);

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

export class CylinderGeometryResource extends PrimitiveGeometryResource {
	public static class_name: string = 'CylinderGeometryResource';

	protected _top_radius: number = 0.5;
	protected _bottom_radius: number = 0.5;
	protected _height: number = 1;
	protected _segments: number = 32;

	public get top_radius() { return this._top_radius; }
	public get bottom_radius() { return this._bottom_radius; }
	public get height() { return this._height; }
	public get segments() { return this._segments; }

	public set top_radius(radius: number) {
		radius = Math.max(radius, 0);
		if (this._top_radius !== radius) {
			this._top_radius = radius;
		}
	}
	public set bottom_radius(radius: number) {
		radius = Math.max(radius, 0);
		if (this._bottom_radius !== radius) {
			this._bottom_radius = radius;
		}
	}
	public set height(height: number) {
		height = Math.max(height, 0);
		if (this._height !== height) {
			this._height = height;
		}
	}
	public set segments(segments: number) {
		segments = Math.max(Math.floor(segments), 3);
		if (this._segments !== segments) {
			this._segments = segments;
		}
	}

	public build() {
		const segments = this.segments;
		const top_radius = this.top_radius;
		const bottom_radius = this.bottom_radius;
		const height = this.height;
		const half_height = height / 2;

		const ring_count = segments + 1;
		const top_side_count = ring_count;
		const bottom_side_count = ring_count;
		const top_cap_count = ring_count;
		const bottom_cap_count = ring_count;
		const top_pole_count = segments;
		const bottom_pole_count = segments;

		const vertex_count = top_side_count + bottom_side_count + top_cap_count + bottom_cap_count + top_pole_count + bottom_pole_count;

		const position_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw, vertex_count);
		const normal_buffer = new RenderDeviceVector3AttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw, vertex_count);
		const uv_buffer = new RenderDeviceVector2AttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw, vertex_count);

		// position / normal

		let offset = 0;
		let length = top_side_count * 3;
		const position_top_side_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
		const normal_top_side_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

		offset += length * Float32Array.BYTES_PER_ELEMENT;
		length = bottom_side_count * 3
		const position_bottom_side_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
		const normal_bottom_side_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

		offset += length * Float32Array.BYTES_PER_ELEMENT;
		length = top_cap_count * 3
		const position_top_cap_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
		const normal_top_cap_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

		offset += length * Float32Array.BYTES_PER_ELEMENT;
		length = bottom_cap_count * 3
		const position_bottom_cap_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
		const normal_bottom_cap_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

		offset += length * Float32Array.BYTES_PER_ELEMENT;
		length = top_pole_count * 3
		const position_top_pole_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
		const normal_top_pole_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

		offset += length * Float32Array.BYTES_PER_ELEMENT;
		length = bottom_pole_count * 3
		const position_bottom_pole_buffer = new Float32Array(position_buffer.data.buffer, offset, length);
		const normal_bottom_pole_buffer = new Float32Array(normal_buffer.data.buffer, offset, length);

		// uv

		offset = 0;
		length = top_side_count * 2;
		const uv_top_side_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

		offset += length * Float32Array.BYTES_PER_ELEMENT;
		length = bottom_side_count * 2
		const uv_bottom_side_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

		offset += length * Float32Array.BYTES_PER_ELEMENT;
		length = top_cap_count * 2
		const uv_top_cap_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

		offset += length * Float32Array.BYTES_PER_ELEMENT;
		length = bottom_cap_count * 2
		const uv_bottom_cap_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

		offset += length * Float32Array.BYTES_PER_ELEMENT;
		length = top_pole_count * 2
		const uv_top_pole_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

		offset += length * Float32Array.BYTES_PER_ELEMENT;
		length = bottom_pole_count * 2
		const uv_bottom_pole_buffer = new Float32Array(uv_buffer.data.buffer, offset, length);

		const slope = height === 0 ? 0 : ((bottom_radius - top_radius) / height);
		const normal_length = 1 + slope * slope;
		
		for (let i = 0; i <= segments; i++) {
			const t = i / segments * Tau;
			const x = Math.cos(t);
			const z = Math.sin(t);

			const vec3_idx = i * 3;
			const vec2_idx = i * 2;

			position_top_cap_buffer[vec3_idx + 0] = position_top_side_buffer[vec3_idx + 0] = x * top_radius;
			position_top_cap_buffer[vec3_idx + 1] = position_top_side_buffer[vec3_idx + 1] = half_height;
			position_top_cap_buffer[vec3_idx + 2] = position_top_side_buffer[vec3_idx + 2] = z * top_radius;
			position_bottom_cap_buffer[vec3_idx + 0] = position_bottom_side_buffer[vec3_idx + 0] = x * bottom_radius;
			position_bottom_cap_buffer[vec3_idx + 1] = position_bottom_side_buffer[vec3_idx + 1] = -half_height;
			position_bottom_cap_buffer[vec3_idx + 2] = position_bottom_side_buffer[vec3_idx + 2] = z * bottom_radius;

			normal_bottom_side_buffer[vec3_idx + 0] = normal_top_side_buffer[vec3_idx + 0] = x / normal_length;
			normal_bottom_side_buffer[vec3_idx + 1] = normal_top_side_buffer[vec3_idx + 1] = slope / normal_length;
			normal_bottom_side_buffer[vec3_idx + 2] = normal_top_side_buffer[vec3_idx + 2] = z / normal_length;
			normal_bottom_cap_buffer[vec3_idx + 0] = normal_top_cap_buffer[vec3_idx + 0] = 0;
			normal_bottom_cap_buffer[vec3_idx + 2] = normal_top_cap_buffer[vec3_idx + 2] = 0;
			normal_top_cap_buffer[vec3_idx + 1] = 1;
			normal_bottom_cap_buffer[vec3_idx + 1] = -1;

			const u = 1 - i / segments;
			uv_top_side_buffer[vec2_idx + 0] = u;
			uv_top_side_buffer[vec2_idx + 1] = 1;
			uv_bottom_cap_buffer[vec2_idx + 0] = uv_top_cap_buffer[vec2_idx + 0] = uv_bottom_side_buffer[vec2_idx + 0] = u;
			uv_bottom_cap_buffer[vec2_idx + 1] = uv_top_cap_buffer[vec2_idx + 1] = uv_bottom_side_buffer[vec2_idx + 1] = 0;

			if (i < segments) {
				position_top_pole_buffer[vec3_idx + 0] = 0;
				position_top_pole_buffer[vec3_idx + 1] = half_height;
				position_top_pole_buffer[vec3_idx + 2] = 0;
				position_bottom_pole_buffer[vec3_idx + 0] = 0;
				position_bottom_pole_buffer[vec3_idx + 1] = -half_height;
				position_bottom_pole_buffer[vec3_idx + 2] = 0;

				normal_bottom_pole_buffer[vec3_idx + 0] = normal_top_pole_buffer[vec3_idx + 0] = 0;
				normal_bottom_pole_buffer[vec3_idx + 2] = normal_top_pole_buffer[vec3_idx + 2] = 0;
				normal_top_pole_buffer[vec3_idx + 1] = 1;
				normal_bottom_pole_buffer[vec3_idx + 1] = -1;

				uv_bottom_pole_buffer[vec2_idx + 0] = uv_top_pole_buffer[vec2_idx + 0] = u;
				uv_bottom_pole_buffer[vec2_idx + 1] = uv_top_pole_buffer[vec2_idx + 1] = 1;
			}
		}

		const side_index_count = segments * 6;
		const top_cap_indx_count = segments * 3;
		const bottom_cap_indx_count = segments * 3;
		const index_count = side_index_count + top_cap_indx_count + bottom_cap_indx_count;

		const index_buffer = new RenderDeviceIndexAttributeBuffer(this.render_server_3d, RenderStateBufferUsage.StaticDraw, index_count);

		const index_side_buffer = new Uint32Array(index_buffer.data.buffer, 0, side_index_count);
		const index_top_cap_buffer = new Uint32Array(index_buffer.data.buffer, side_index_count * Uint32Array.BYTES_PER_ELEMENT, top_cap_indx_count);
		const index_bottom_cap_buffer = new Uint32Array(index_buffer.data.buffer, (side_index_count + top_cap_indx_count) * Uint32Array.BYTES_PER_ELEMENT, bottom_cap_indx_count);

		for (let i = 0; i < segments; i++) {
			const index_side_idx = i * 6;
			index_side_buffer[index_side_idx + 0] = i;
			index_side_buffer[index_side_idx + 4] = index_side_buffer[index_side_idx + 1] = i + 1;
			index_side_buffer[index_side_idx + 3] = index_side_buffer[index_side_idx + 2] = i + ring_count;
			index_side_buffer[index_side_idx + 5] = i + 1 + ring_count;

			const index_top_cap_idx = i * 3;
			index_top_cap_buffer[index_top_cap_idx + 0] = i + ring_count * 2;
			index_top_cap_buffer[index_top_cap_idx + 1] = i + ring_count * 4;
			index_top_cap_buffer[index_top_cap_idx + 2] = i + ring_count * 2 + 1;

			index_bottom_cap_buffer[index_top_cap_idx + 0] = i + ring_count * 3;
			index_bottom_cap_buffer[index_top_cap_idx + 1] = i + ring_count * 3 + 1;
			index_bottom_cap_buffer[index_top_cap_idx + 2] = i + ring_count * 4 + segments;
		}

		position_buffer.commit_Data();
		normal_buffer.commit_Data();
		uv_buffer.commit_Data();
		index_buffer.commit_Data();

		const max_radius = Math.max(top_radius, bottom_radius);

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
				vec3(-max_radius, -half_height, -max_radius),
				vec3(max_radius, half_height, max_radius),
			)
		);
		this.geometry.add_Surface(0, segments * 6);
		this.geometry.add_Surface(segments * 6 * index_buffer.per_element_byte_count, segments * 3);
		this.geometry.add_Surface(segments * 9 * index_buffer.per_element_byte_count, segments * 3);
	}

	// save / load

	public dump(writer: ClassWriter): void {
		writer.property('top_radius', this.top_radius);
		writer.property('bottom_radius', this.bottom_radius);
		writer.property('height', this.height);
		writer.property('segments', this.segments);
	}

	public load(reader: ClassReader): void {
		this.top_radius = reader.get<number>('top_radius') ?? 0.5;
		this.bottom_radius = reader.get<number>('bottom_radius') ?? 0.5;
		this.height = reader.get<number>('height') ?? 1;
		this.segments = reader.get<number>('segments') ?? 32;
		this.build();
	}
}