import { BufferGeometry, Vector3, InstancedInterleavedBuffer, InterleavedBufferAttribute, Color } from 'three';
import { Resource } from '../Resource';
import { LineGeometry } from 'three/addons/lines/LineGeometry';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry';

export class GeometryResource extends Resource {
    public get_BufferGeometry(): BufferGeometry {
        throw new Error('abstract method');
    }
}

export class BufferGeometryResource extends GeometryResource {
    private readonly buffer_geometry: BufferGeometry = new BufferGeometry();

    constructor() {
        super();
    }

    public get_BufferGeometry(): BufferGeometry {
        return this.buffer_geometry;
    }
}

export class ThreeGeometryResource extends GeometryResource {
    private readonly buffer_geometry: BufferGeometry;

    constructor(buffer_geometry: BufferGeometry) {
        super();
        this.buffer_geometry = buffer_geometry;
    }

    public get_BufferGeometry(): BufferGeometry {
        return this.buffer_geometry;
    }
}

export class PolyLineGeometryResource extends GeometryResource {
    private line_geometry: LineGeometry = new LineGeometry();

    private _points: Vector3[] = [];
    public get points() {
        return this._points;
    }
    public set points(points: Vector3[]) {
        this._points = points;
        (this.line_geometry as BufferGeometry).deleteAttribute('instanceDistanceStart');
        (this.line_geometry as BufferGeometry).deleteAttribute('instanceDistanceEnd');
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
    }

    public get_BufferGeometry(): BufferGeometry {
        return this.line_geometry;
    }
}

export class SegmentLineGeometryResource extends GeometryResource {
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

    public get_BufferGeometry(): BufferGeometry {
        return this.line_segment_geometry;
    }
}