import { BufferGeometry, Vector3, InstancedInterleavedBuffer, InterleavedBufferAttribute, Color, ObjectLoader } from 'three';
import { Resource } from '../Resource';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { ClassReader, type ClassWriter } from '../classes/ClassWriterReader';
import { ValueObject } from '../classes/ValueObject';
import { PlainObject } from '../classes/PlainObject';

declare module 'three' {
    interface BufferGeometry {
        isRefCounted: boolean;
        ref_count(): number;
        ref(): void;
        unref(): void;
    }
}

BufferGeometry.prototype.isRefCounted = true;
BufferGeometry.prototype.ref = function () {
    this.userData.ref_count++;
}
BufferGeometry.prototype.ref_count = function () {
    return this.userData.ref_count;
}
BufferGeometry.prototype.unref = function () {
    if (this.ref_count() === 0) return;
    const ref_count = --this.userData.ref_count;
    if (ref_count <= 0) {
        this.dispose();
    }
}

export class GeometryResource extends Resource {
    public static readonly class_name: string = "GeometryResource";

    constructor() {
        super();
    }

    protected init_RefCount() {
        this.get_BufferGeometry().userData.ref_count = 0;
    }

    public get_BufferGeometry(): BufferGeometry {
        throw new Error('abstract method');
    }
}

export class ThreeGeometryResource extends GeometryResource {
    public static readonly class_name: string = "ThreeGeometryResource";
    public static readonly use_custom_instantiater: boolean = true;

    private readonly buffer_geometry: BufferGeometry;

    constructor(buffer_geometry: BufferGeometry) {
        super();
        this.buffer_geometry = buffer_geometry;
        this.init_RefCount();
    }

    public get_BufferGeometry(): BufferGeometry {
        return this.buffer_geometry;
    }

    public dump(writer: ClassWriter): void {
        writer.initialization('three_geometry', new PlainObject(this.buffer_geometry.toJSON()));
    }

    public load(reader: ClassReader): void { }

    public static instantiate(data: any | ClassReader): ThreeGeometryResource {
        if (data instanceof ClassReader) {
            const three_geometry: PlainObject | undefined = data.get('three_geometry');
            if (three_geometry === undefined || !(three_geometry instanceof PlainObject)) throw new Error('can not instantiate ThreeGeometryResource');
            const loader = new ObjectLoader();
            const geometries = loader.parseGeometries([three_geometry.value]);
            const geometry = geometries[three_geometry.value.uuid];
            return new ThreeGeometryResource(geometry);
        }
        else {
            const three_geometry: BufferGeometry | undefined = data.three_geometry;
            if (three_geometry === undefined || !(three_geometry instanceof BufferGeometry)) throw new Error('can not instantiate ThreeGeometryResource');
            return new ThreeGeometryResource(three_geometry);
        }
    }
}

export class PolyLineGeometryResource extends GeometryResource {
    public static readonly class_name: string = "PolyLineGeometryResource";

    private line_geometry: LineGeometry = new LineGeometry();

    private _points: Vector3[] = [];
    public get points() {
        return this._points;
    }
    public set points(points: Vector3[]) {
        this._points = points;
        (this.line_geometry as BufferGeometry).deleteAttribute('instanceDistanceStart');
        (this.line_geometry as BufferGeometry).deleteAttribute('instanceDistanceEnd');
        this.line_distance_computed = false;
        this.line_geometry.setPositions(this._points.flatMap(p => [p.x, p.y, p.z]));
    }

    private _colors: Color[] = [];
    public get colors() {
        return this._colors;
    }
    public set colors(colors: Color[]) {
        this._colors = colors;
        this.line_geometry.setColors(this._colors.flatMap(c => [c.r, c.g, c.b]));
    }

    constructor() {
        super();
        this.init_RefCount();
    }

    private line_distance_computed: boolean = false;

    public compute_LineDistances() {
        const instance_start = this.line_geometry.attributes.instanceStart;
        const instance_end = this.line_geometry.attributes.instanceEnd;
        const line_distances = new Float32Array(2 * instance_start.count);
        for (let i = 0, j = 0, l = instance_start.count; i < l; i++, j += 2) {
            const _start = new Vector3().fromBufferAttribute(instance_start, i);
            const _end = new Vector3().fromBufferAttribute(instance_end, i);
            line_distances[j] = (j === 0) ? 0 : line_distances[j - 1];
            line_distances[j + 1] = line_distances[j] + _start.distanceTo(_end);
        }
        const instance_distance_buffer = new InstancedInterleavedBuffer(line_distances, 2, 1); // d0, d1
        (this.line_geometry as BufferGeometry).setAttribute('instanceDistanceStart', new InterleavedBufferAttribute(instance_distance_buffer, 1, 0)); // d0
        (this.line_geometry as BufferGeometry).setAttribute('instanceDistanceEnd', new InterleavedBufferAttribute(instance_distance_buffer, 1, 1)); // d1
        this.line_distance_computed = true;
    }

    public get_BufferGeometry(): BufferGeometry {
        return this.line_geometry;
    }

    public dump(writer: ClassWriter): void {
        writer.property('points', new ValueObject(this.points))
            .property('colors', new ValueObject(this.colors))
            .property('compute_line_distance', this.line_distance_computed);
    }

    public load(reader: ClassReader): void {
        const points = reader.get<ValueObject>('points')?.value;
        if (points !== undefined) this.points = points;
        const colors = reader.get<ValueObject>('colors')?.value;
        if (colors !== undefined) this.colors = colors;
        const line_distance_computed = reader.get<boolean>('compute_line_distance') ?? false;
        if (line_distance_computed) this.compute_LineDistances();
    }
}

export class SegmentLineGeometryResource extends GeometryResource {
    public static readonly class_name: string = "SegmentLineGeometryResource";

    private line_segment_geometry: LineSegmentsGeometry = new LineSegmentsGeometry();

    private _points: Vector3[] = [];
    public get points() {
        return this._points;
    }
    public set points(points: Vector3[]) {
        this._points = points;
        this.line_segment_geometry.setPositions(this._points.flatMap(p => [p.x, p.y, p.z]));
    }

    private _colors: Color[] = [];
    public get colors() {
        return this._colors;
    }
    public set colors(colors: Color[]) {
        this._colors = colors;
        this.line_segment_geometry.setColors(this._colors.flatMap(c => [c.r, c.g, c.b]));
    }

    constructor() {
        super();
        this.init_RefCount();
    }

    public get_BufferGeometry(): BufferGeometry {
        return this.line_segment_geometry;
    }

    public dump(writer: ClassWriter): void {
        writer.property('points', new ValueObject(this.points))
            .property('colors', new ValueObject(this.colors));
    }

    public load(reader: ClassReader): void {
        const points = reader.get<ValueObject>('points')?.value;
        if (points !== undefined) this.points = points;
        const colors = reader.get<ValueObject>('colors')?.value;
        if (colors !== undefined) this.colors = colors;
    }
}