import type { RenderDevice } from "@/system/sliverofstraw/RenderDevice";
import type { RenderState, RenderStateBufferUsage } from "@/system/sliverofstraw/RenderState";
import { RenderDeviceVector2AttributeBuffer, type RenderDeviceAttributeBuffer, RenderDeviceVector3AttributeBuffer, RenderDeviceVector4AttributeBuffer, RenderDeviceMatrix4AttributeBuffer, RenderDeviceIndexAttributeBuffer, RenderDeviceMatrix3AttributeBuffer, RenderDeviceFloatAttributeBuffer, RenderDeviceIntAttributeBuffer, RenderDeviceUintAttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";

export abstract class PackedArray {
    public abstract get data(): ArrayBufferView;

    public abstract get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceAttributeBuffer<T>;
}

export class PackedByteArray extends PackedArray {
    public readonly data: Uint8Array | Uint8ClampedArray;

    constructor(length: number)
    constructor(array: Uint8Array | Uint8ClampedArray)
    constructor(data: Uint8Array | Uint8ClampedArray | number) {
        super();
        if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
            this.data = data;
        }
        else {
            this.data = new Uint8Array(data);
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceIndexAttributeBuffer<T> {
        throw new Error('<PackedByteArray> get_RenderDeviceAttributeBuffer: cannot get attribute buffer from PackedByteArray')
    }
}

export class PackedIndexArray extends PackedArray {
    public readonly data: Uint32Array;

    constructor(length: number)
    constructor(array: Uint32Array)
    constructor(data: Uint32Array | number) {
        super();
        if (data instanceof Uint32Array) {
            this.data = data;
        }
        else {
            this.data = new Uint32Array(data);
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceIndexAttributeBuffer<T> {
        return new RenderDeviceIndexAttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedUintArray extends PackedArray {
    public readonly data: Uint32Array;

    constructor(length: number)
    constructor(array: Uint32Array)
    constructor(data: Uint32Array | number) {
        super();
        if (data instanceof Uint32Array) {
            this.data = data;
        }
        else {
            this.data = new Uint32Array(data);
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceUintAttributeBuffer<T> {
        return new RenderDeviceUintAttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedFloatArray extends PackedArray {
    public readonly data: Float32Array;

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            this.data = data;
        }
        else {
            this.data = new Float32Array(data);
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceFloatAttributeBuffer<T> {
        return new RenderDeviceFloatAttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedIntArray extends PackedArray {
    public readonly data: Int32Array;

    constructor(length: number)
    constructor(array: Int32Array)
    constructor(data: Int32Array | number) {
        super();
        if (data instanceof Int32Array) {
            this.data = data;
        }
        else {
            this.data = new Int32Array(data);
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceIntAttributeBuffer<T> {
        return new RenderDeviceIntAttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedVector2Array extends PackedArray {
    public readonly data: Float32Array;

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 2 !== 0) throw new Error('<PackedVector2Array> constructor@array: array is not a valid PackedVector2Array');
            this.data = data;
        }
        else {
            if (data % 2 !== 0) throw new Error('<PackedVector2Array> constructor@array: array is not a valid PackedVector2Array');
            this.data = new Float32Array(data);
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceVector2AttributeBuffer<T> {
        return new RenderDeviceVector2AttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedVector3Array extends PackedArray {
    public readonly data: Float32Array;

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 3 !== 0) throw new Error('<PackedVector3Array> constructor@array: array is not a valid PackedVector3Array');
            this.data = data;
        }
        else {
            if (data % 3 !== 0) throw new Error('<PackedVector3Array> constructor@array: array is not a valid PackedVector3Array');
            this.data = new Float32Array(data);
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceVector3AttributeBuffer<T> {
        return new RenderDeviceVector3AttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedVector4Array extends PackedArray {
    public readonly data: Float32Array;

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 4 !== 0) throw new Error('<PackedVector4Array> constructor@array: array is not a valid PackedVector4Array');
            this.data = data;
        }
        else {
            if (data % 4 !== 0) throw new Error('<PackedVector4Array> constructor@array: array is not a valid PackedVector4Array');
            this.data = new Float32Array(data);
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceVector4AttributeBuffer<T> {
        return new RenderDeviceVector4AttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedMatrix3Array extends PackedArray {
    public readonly data: Float32Array;

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 9 !== 0) throw new Error('<PackedMatrix3Array> constructor@array: array is not a valid PackedMatrix3Array');
            this.data = data;
        }
        else {
            if (data % 9 !== 0) throw new Error('<PackedMatrix3Array> constructor@array: array is not a valid PackedMatrix3Array');
            this.data = new Float32Array(data);
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceMatrix3AttributeBuffer<T> {
        return new RenderDeviceMatrix3AttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedMatrix4Array extends PackedArray {
    public readonly data: Float32Array;

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 16 !== 0) throw new Error('<PackedMatrix4Array> constructor@array: array is not a valid PackedMatrix4Array');
            this.data = data;
        }
        else {
            if (data % 16 !== 0) throw new Error('<PackedMatrix4Array> constructor@array: array is not a valid PackedMatrix4Array');
            this.data = new Float32Array(data);
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceMatrix4AttributeBuffer<T> {
        return new RenderDeviceMatrix4AttributeBuffer(render_device, usage, this.data);
    }
}