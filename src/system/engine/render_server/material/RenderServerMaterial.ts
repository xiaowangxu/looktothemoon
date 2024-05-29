import { Ref, RefArray, type RefCountedLike } from "@/system/utils/RefCounted";
import { RenderServerObjectRefCounted } from "../RenderServerObject";
import type { WebGPURenderStateBuffer, WebGPURenderStateBufferData } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import type { WebGPURenderStateBufferView } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBufferView";

export enum RenderServerMaterialType {
	Render, Compute,
}

class RenderServerMaterialUniformBufferItem implements RefCountedLike {

	public readonly buffer: WebGPURenderStateBuffer | WebGPURenderStateBufferView;
	public data: WebGPURenderStateBufferData;
	public changed: boolean = true;

	constructor(buffer: WebGPURenderStateBuffer, data: WebGPURenderStateBufferData) {
		this.buffer = buffer;
		this.data = data;
	}

	public commit(force: boolean = false) {
		if (force || this.changed) {
			this.changed = false;
			this.buffer.update_Data(0, this.data);
		}
	}

	ref(): void {
		this.buffer.ref();
	}

	unref(): void {
		this.buffer.unref();
	}

	release(): void {
		this.buffer.release();
	}
}

export abstract class RenderServerMaterial<Next extends RenderServerMaterial<Next>> extends RenderServerObjectRefCounted {

	protected readonly uniform_buffer_refs: RefArray<RenderServerMaterialUniformBufferItem> = new RefArray(0);
	public readonly next_pass_ref: Ref<Next> = new Ref();
	public get next_pass() { return this.next_pass_ref.value; }

	public set_NextPass(pass: Next | undefined) {
		this.next_pass_ref.value = pass;
	}

	public add_UniformBuffer(buffer: WebGPURenderStateBuffer, data: WebGPURenderStateBufferData) {
		this.uniform_buffer_refs.push(new RenderServerMaterialUniformBufferItem(buffer, data));
	}

	public set_UniformBufferData(index: number, data: WebGPURenderStateBufferData) {
		const item = this.uniform_buffer_refs.get(index);
		if (item !== undefined) {
			item.data = data;
		}
	}

	public trigger_UniformBufferChange(index: number) {
		const item = this.uniform_buffer_refs.get(index);
		if (item !== undefined) {
			item.changed = true;
		}
	}

	public update_UniformBuffers() {
		for (let i = 0, l = this.uniform_buffer_refs.length; i < l; i++) {
			const item = this.uniform_buffer_refs.get(i);
			if (item !== undefined) {
				item.commit();
			}
		}
	}

	public dispose(): void {
		this.uniform_buffer_refs.clear();
		this.next_pass_ref.clear();
	}
}