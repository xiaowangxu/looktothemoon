import { type AABB, type BvhIndexShape, type BvhLike, type BvhShape, type BvhShapes } from "./BvhLike";
import { Vector3 } from "../linear_algebra/Vector3";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import { Box3 } from "../geometries/Box3";
import { Epsilon } from "../Scalar";

export class BvhNode3<BuildShape> {
    public parent: BvhNode3<BuildShape> | undefined;
    public depth: number = 0;
    public readonly aabb: AABB3;
    public shapes: BuildShape[];
    // children
    public left: BvhNode3<BuildShape> | undefined = undefined;
    public right: BvhNode3<BuildShape> | undefined = undefined;

    public get is_leaf() { return this.left === undefined && this.right === undefined; }

    constructor(
        parent: BvhNode3<BuildShape> | undefined,
        depth: number,
        aabb: AABB3,
        shapes: BuildShape[],
        left: BvhNode3<BuildShape> | undefined = undefined,
        right: BvhNode3<BuildShape> | undefined = undefined,
    ) {
        this.parent = parent;
        this.depth = depth;
        this.aabb = aabb;
        this.shapes = shapes;
        this.left = left;
        this.right = right;
    }
}

enum Bvh3Axis {
    X, Y, Z
};

export enum Bvh3Strategy {
    Center, Average,
    // SAH,
    X, Y, Z,
}

type AABB3 = Box3;
type BvhShape3 = BvhShape<Vector3, Matrix3>;
type BvhIndexShape3 = BvhIndexShape<Vector3, Matrix3>;
export type BvhExtractShape<T extends BaseBvh3> = T extends BaseBvh3<infer R, infer B> ? R : never;
export type BvhExtractBuild<T extends BaseBvh3> = T extends BaseBvh3<infer R, infer B> ? B : never;

export abstract class BaseBvh3<
    Shape extends BvhShape3[] | BvhIndexShape3 = BvhShape3[] | BvhIndexShape3,
    BuildShape extends BvhShape3 | number = BvhShape3 | number
> implements BvhLike<Vector3, Matrix3, Shape, BuildShape> {

    static readonly #const_empty_shapes: BvhShape3[] = [];
    protected static $tmp_split_axis: Bvh3Axis = Bvh3Axis.X;
    protected static $tmp_split_position: number = 0;
    protected static readonly $tmp_centroid_box: AABB3 = Box3.new;
    static readonly #tmp_vector3_0: Vector3 = Vector3.new;

    public root: BvhNode3<BuildShape> | undefined;
    protected shape_aabbs_map: Map<BuildShape, AABB3> = new Map();
    protected shape_aabbs: AABB3[] = [];
    public get is_empty() { return this.root === undefined; }

    constructor() { }

    public abstract build(shapes: Shape, max_depth?: number, strategy?: number): void;

    public clear() {
        this.root = undefined;
        this.shape_aabbs = [];
        this.shape_aabbs_map.clear();
    }

    protected get_CentriodAABB(shapes: BuildShape[], target: AABB3) {
        let cminx = Infinity;
        let cminy = Infinity;
        let cminz = Infinity;
        let cmaxx = - Infinity;
        let cmaxy = - Infinity;
        let cmaxz = - Infinity;
        for (let i = 0; i < shapes.length; i++) {
            const aabb = this.shape_aabbs_map.get(shapes[i])!;
            const center = aabb.get_Center(BaseBvh3.#tmp_vector3_0);
            const cx = center.x;
            if (cx < cminx) cminx = cx;
            if (cx > cmaxx) cmaxx = cx;
            const cy = center.y;
            if (cy < cminy) cminy = cy;
            if (cy > cmaxy) cmaxy = cy;
            const cz = center.z;
            if (cz < cminz) cminz = cz;
            if (cz > cmaxz) cmaxz = cz;
        }
        target.min.set(cminx, cminy, cminz);
        target.max.set(cmaxx, cmaxy, cmaxz);
        return target;
    }

    protected static get_LongestAxis(aabb: AABB3) {
        const a = aabb.max.x - aabb.min.x; // x
        const b = aabb.max.y - aabb.min.y; // y
        const c = aabb.max.z - aabb.min.z; // z
        if ((a >= b) && (a >= c)) {
            BaseBvh3.$tmp_split_axis = Bvh3Axis.X;
            BaseBvh3.$tmp_split_position = a;
        }
        else if ((b >= a) && (b >= c)) {
            BaseBvh3.$tmp_split_axis = Bvh3Axis.Y;
            BaseBvh3.$tmp_split_position = b;
        }
        else {
            BaseBvh3.$tmp_split_axis = Bvh3Axis.Z;
            BaseBvh3.$tmp_split_position = c;
        }
    }

    protected get_OptimalSplit(parent_aabb: AABB3, centroid_aabb: AABB3, shapes: BuildShape[], strategy: Bvh3Strategy): boolean {
        // Center
        if (strategy === Bvh3Strategy.Center) {
            BaseBvh3.get_LongestAxis(centroid_aabb);
            const axis = BaseBvh3.$tmp_split_axis, length = BaseBvh3.$tmp_split_position;
            if (length < Epsilon) return false;
            switch (axis) {
                case Bvh3Axis.X: {
                    BaseBvh3.$tmp_split_position = (centroid_aabb.min.x + centroid_aabb.max.x) / 2;
                    break;
                }
                case Bvh3Axis.Y: {
                    BaseBvh3.$tmp_split_position = (centroid_aabb.min.y + centroid_aabb.max.y) / 2;
                    break;
                }
                case Bvh3Axis.Z: {
                    BaseBvh3.$tmp_split_position = (centroid_aabb.min.z + centroid_aabb.max.z) / 2;
                    break;
                }
            }
            return true;
        }
        else if (strategy === Bvh3Strategy.Average) {
            BaseBvh3.get_LongestAxis(parent_aabb);
            const axis = BaseBvh3.$tmp_split_axis, length = BaseBvh3.$tmp_split_position;
            if (length < Epsilon) return false;
            BaseBvh3.$tmp_split_position = this.get_Average(shapes, axis);
            return true;
        }
        else if (strategy === Bvh3Strategy.X) {
            const length = BaseBvh3.get_Axis(centroid_aabb.max, Bvh3Axis.X) - BaseBvh3.get_Axis(centroid_aabb.min, Bvh3Axis.X);
            if (length < Epsilon) return false;
            BaseBvh3.$tmp_split_axis = Bvh3Axis.X;
            BaseBvh3.$tmp_split_position = (centroid_aabb.min.x + centroid_aabb.max.x) / 2;
            return true;
        }
        else if (strategy === Bvh3Strategy.Y) {
            const length = BaseBvh3.get_Axis(centroid_aabb.max, Bvh3Axis.Y) - BaseBvh3.get_Axis(centroid_aabb.min, Bvh3Axis.Y);
            if (length < Epsilon) return false;
            BaseBvh3.$tmp_split_axis = Bvh3Axis.Y;
            BaseBvh3.$tmp_split_position = (centroid_aabb.min.y + centroid_aabb.max.y) / 2;
            return true;
        }
        else if (strategy === Bvh3Strategy.Z) {
            const length = BaseBvh3.get_Axis(centroid_aabb.max, Bvh3Axis.Z) - BaseBvh3.get_Axis(centroid_aabb.min, Bvh3Axis.Z);
            if (length < Epsilon) return false;
            BaseBvh3.$tmp_split_axis = Bvh3Axis.Z;
            BaseBvh3.$tmp_split_position = (centroid_aabb.min.z + centroid_aabb.max.z) / 2;
            return true;
        }

        // else if (strategy === Bvh3Strategy.SAH) {
        //     const root_surface_area = BaseBvh3.get_SurfaceArea(parent_aabb);
        //     let best_cost = TRIANGLE_INTERSECT_COST * count;

        //     // iterate over all axes
        //     const cStart = offset * 6;
        //     const cEnd = (offset + count) * 6;
        //     for (let a = 0; a < 3; a++) {

        //         const axisLeft = centroidBoundingData[a];
        //         const axisRight = centroidBoundingData[a + 3];
        //         const axisLength = axisRight - axisLeft;
        //         const binWidth = axisLength / BIN_COUNT;

        //         // If we have fewer triangles than we're planning to split then just check all
        //         // the triangle positions because it will be faster.
        //         if (count < BIN_COUNT / 4) {

        //             // initialize the bin candidates
        //             const truncatedBins = [...sahBins];
        //             truncatedBins.length = count;

        //             // set the candidates
        //             let b = 0;
        //             for (let c = cStart; c < cEnd; c += 6, b++) {

        //                 const bin = truncatedBins[b];
        //                 bin.candidate = triangleBounds[c + 2 * a];
        //                 bin.count = 0;

        //                 const {
        //                     bounds,
        //                     leftCacheBounds,
        //                     rightCacheBounds,
        //                 } = bin;
        //                 for (let d = 0; d < 3; d++) {

        //                     rightCacheBounds[d] = Infinity;
        //                     rightCacheBounds[d + 3] = - Infinity;

        //                     leftCacheBounds[d] = Infinity;
        //                     leftCacheBounds[d + 3] = - Infinity;

        //                     bounds[d] = Infinity;
        //                     bounds[d + 3] = - Infinity;

        //                 }

        //                 expandByTriangleBounds(c, triangleBounds, bounds);

        //             }

        //             truncatedBins.sort(binsSort);

        //             // remove redundant splits
        //             let splitCount = count;
        //             for (let bi = 0; bi < splitCount; bi++) {

        //                 const bin = truncatedBins[bi];
        //                 while (bi + 1 < splitCount && truncatedBins[bi + 1].candidate === bin.candidate) {

        //                     truncatedBins.splice(bi + 1, 1);
        //                     splitCount--;

        //                 }

        //             }

        //             // find the appropriate bin for each triangle and expand the bounds.
        //             for (let c = cStart; c < cEnd; c += 6) {

        //                 const center = triangleBounds[c + 2 * a];
        //                 for (let bi = 0; bi < splitCount; bi++) {

        //                     const bin = truncatedBins[bi];
        //                     if (center >= bin.candidate) {

        //                         expandByTriangleBounds(c, triangleBounds, bin.rightCacheBounds);

        //                     } else {

        //                         expandByTriangleBounds(c, triangleBounds, bin.leftCacheBounds);
        //                         bin.count++;

        //                     }

        //                 }

        //             }

        //             // expand all the bounds
        //             for (let bi = 0; bi < splitCount; bi++) {

        //                 const bin = truncatedBins[bi];
        //                 const leftCount = bin.count;
        //                 const rightCount = count - bin.count;

        //                 // check the cost of this split
        //                 const leftBounds = bin.leftCacheBounds;
        //                 const rightBounds = bin.rightCacheBounds;

        //                 let leftProb = 0;
        //                 if (leftCount !== 0) {

        //                     leftProb = computeSurfaceArea(leftBounds) / root_surface_area;

        //                 }

        //                 let rightProb = 0;
        //                 if (rightCount !== 0) {

        //                     rightProb = computeSurfaceArea(rightBounds) / root_surface_area;

        //                 }

        //                 const cost = TRAVERSAL_COST + TRIANGLE_INTERSECT_COST * (
        //                     leftProb * leftCount + rightProb * rightCount
        //                 );

        //                 if (cost < best_cost) {

        //                     axis = a;
        //                     best_cost = cost;
        //                     pos = bin.candidate;

        //                 }

        //             }

        //         } else {

        //             // reset the bins
        //             for (let i = 0; i < BIN_COUNT; i++) {

        //                 const bin = sahBins[i];
        //                 bin.count = 0;
        //                 bin.candidate = axisLeft + binWidth + i * binWidth;

        //                 const bounds = bin.bounds;
        //                 for (let d = 0; d < 3; d++) {

        //                     bounds[d] = Infinity;
        //                     bounds[d + 3] = - Infinity;

        //                 }

        //             }

        //             // iterate over all center positions
        //             for (let c = cStart; c < cEnd; c += 6) {

        //                 const triCenter = triangleBounds[c + 2 * a];
        //                 const relativeCenter = triCenter - axisLeft;

        //                 // in the partition function if the centroid lies on the split plane then it is
        //                 // considered to be on the right side of the split
        //                 let binIndex = ~ ~(relativeCenter / binWidth);
        //                 if (binIndex >= BIN_COUNT) binIndex = BIN_COUNT - 1;

        //                 const bin = sahBins[binIndex];
        //                 bin.count++;

        //                 expandByTriangleBounds(c, triangleBounds, bin.bounds);

        //             }

        //             // cache the unioned bounds from right to left so we don't have to regenerate them each time
        //             const lastBin = sahBins[BIN_COUNT - 1];
        //             copyBounds(lastBin.bounds, lastBin.rightCacheBounds);
        //             for (let i = BIN_COUNT - 2; i >= 0; i--) {

        //                 const bin = sahBins[i];
        //                 const nextBin = sahBins[i + 1];
        //                 unionBounds(bin.bounds, nextBin.rightCacheBounds, bin.rightCacheBounds);

        //             }

        //             let leftCount = 0;
        //             for (let i = 0; i < BIN_COUNT - 1; i++) {

        //                 const bin = sahBins[i];
        //                 const binCount = bin.count;
        //                 const bounds = bin.bounds;

        //                 const nextBin = sahBins[i + 1];
        //                 const rightBounds = nextBin.rightCacheBounds;

        //                 // dont do anything with the bounds if the new bounds have no triangles
        //                 if (binCount !== 0) {

        //                     if (leftCount === 0) {

        //                         copyBounds(bounds, leftBounds);

        //                     } else {

        //                         unionBounds(bounds, leftBounds, leftBounds);

        //                     }

        //                 }

        //                 leftCount += binCount;

        //                 // check the cost of this split
        //                 let leftProb = 0;
        //                 let rightProb = 0;

        //                 if (leftCount !== 0) {

        //                     leftProb = computeSurfaceArea(leftBounds) / root_surface_area;

        //                 }

        //                 const rightCount = count - leftCount;
        //                 if (rightCount !== 0) {

        //                     rightProb = computeSurfaceArea(rightBounds) / root_surface_area;

        //                 }

        //                 const cost = TRAVERSAL_COST + TRIANGLE_INTERSECT_COST * (
        //                     leftProb * leftCount + rightProb * rightCount
        //                 );

        //                 if (cost < best_cost) {

        //                     axis = a;
        //                     best_cost = cost;
        //                     pos = bin.candidate;

        //                 }

        //             }

        //         }

        //     }

        // }

        return false;
    }

    protected static get_Axis(vec: Vector3, axis: Bvh3Axis) {
        switch (axis) {
            case Bvh3Axis.X: return vec.x;
            case Bvh3Axis.Y: return vec.y;
            case Bvh3Axis.Z: return vec.z;
        }
    }

    protected get_Average(shapes: BuildShape[], axis: Bvh3Axis) {
        let avg = 0;
        let count = 0;
        for (const shape of shapes) {
            const aabb = this.shape_aabbs_map.get(shape)!;
            avg += BaseBvh3.get_Axis(aabb.min, axis) + BaseBvh3.get_Axis(aabb.max, axis);
            count += 2;
        }
        return avg / count;
    }

    protected static get_SurfaceArea(aabb: AABB3) {
        const x = aabb.max.x - aabb.min.x;
        const y = aabb.max.y - aabb.min.y;
        const z = aabb.max.z - aabb.min.z;
        return 2 * (x * y + y * z + z * x);
    }

    protected build_Internal(parent: BvhNode3<BuildShape> | undefined, parent_aabb: AABB3, shapes: BuildShape[], depth: number, max_depth: number, strategy: Bvh3Strategy): BvhNode3<BuildShape> | undefined {
        const count = shapes.length;
        if (count === 0) return undefined;
        if (count === 1) {
            const node = new BvhNode3(parent, depth, parent_aabb, shapes, undefined, undefined);
            return node;
        }
        if (depth >= max_depth) {
            const node = new BvhNode3(parent, depth, parent_aabb, shapes, undefined, undefined);
            return node;
        }
        const centroid_aabb = this.get_CentriodAABB(shapes, BaseBvh3.$tmp_centroid_box);
        // split
        const split = this.get_OptimalSplit(parent_aabb, centroid_aabb, shapes, strategy);
        if (!split) {
            // can not split further
            const node = new BvhNode3(parent, depth, parent_aabb, shapes, undefined, undefined);
            return node;
        }
        else {
            const axis = BaseBvh3.$tmp_split_axis, pos = BaseBvh3.$tmp_split_position;
            // can split
            const left: BuildShape[] = [];
            const right: BuildShape[] = [];
            let left_minx = Infinity, left_maxx = - Infinity;
            let left_miny = Infinity, left_maxy = - Infinity;
            let left_minz = Infinity, left_maxz = - Infinity;
            let right_minx = Infinity, right_maxx = - Infinity;
            let right_miny = Infinity, right_maxy = - Infinity;
            let right_minz = Infinity, right_maxz = - Infinity;
            for (const shape of shapes) {
                const aabb = this.shape_aabbs_map.get(shape)!;
                const center = aabb.center;
                const min_x = aabb.min.x, max_x = aabb.max.x;
                const min_y = aabb.min.y, max_y = aabb.max.y;
                const min_z = aabb.min.z, max_z = aabb.max.z;
                const axis_center = BaseBvh3.get_Axis(center, axis);
                if (axis_center < pos) {
                    // left
                    left.push(shape);
                    if (min_x < left_minx) left_minx = min_x;
                    if (max_x > left_maxx) left_maxx = max_x;
                    if (min_y < left_miny) left_miny = min_y;
                    if (max_y > left_maxy) left_maxy = max_y;
                    if (min_z < left_minz) left_minz = min_z;
                    if (max_z > left_maxz) left_maxz = max_z;
                }
                else {
                    // right
                    right.push(shape);
                    if (min_x < right_minx) right_minx = min_x;
                    if (max_x > right_maxx) right_maxx = max_x;
                    if (min_y < right_miny) right_miny = min_y;
                    if (max_y > right_maxy) right_maxy = max_y;
                    if (min_z < right_minz) right_minz = min_z;
                    if (max_z > right_maxz) right_maxz = max_z;
                }
            }
            const node = new BvhNode3(parent, depth, parent_aabb, shapes, undefined, undefined);
            node.left = this.build_Internal(node, Box3.create(Vector3.create(left_minx, left_miny, left_minz), Vector3.create(left_maxx, left_maxy, left_maxz)), left, depth + 1, max_depth, strategy);
            node.right = this.build_Internal(node, Box3.create(Vector3.create(right_minx, right_miny, right_minz), Vector3.create(right_maxx, right_maxy, right_maxz)), right, depth + 1, max_depth, strategy);
            return node;
        }
    }

    //#region query

    public traverse(func: (aabb: AABB3) => boolean, max_depth: number = Infinity, target: BuildShape[] = []) {
        if (this.root === undefined) return target;
        return this.traverse_Internal(this.root, func, 0, max_depth, target);
    }

    protected traverse_Internal(node: BvhNode3<BuildShape>, func: (aabb: AABB3) => boolean, depth: number = 0, max_depth: number = Infinity, result: BuildShape[] = []) {
        const hit = func(node.aabb);
        if (!hit) return result;
        if (node.is_leaf || depth >= max_depth) {
            result.push(...node.shapes);
            return result;
        }
        const children_depth = depth + 1;
        if (node.left !== undefined) this.traverse_Internal(node.left, func, children_depth, max_depth, result);
        if (node.right !== undefined) this.traverse_Internal(node.right, func, children_depth, max_depth, result);
        return result;
    }

    public traverse_Callback<S extends BuildShape = BuildShape>(func: (aabb: AABB3) => boolean, callback: (shape: S) => void, max_depth: number = Infinity) {
        if (this.root === undefined) return;
        return this.traverse_CallbackInternal<S>(this.root, func, callback, 0, max_depth);
    }

    protected traverse_CallbackInternal<S extends BuildShape = BuildShape>(node: BvhNode3<BuildShape>, func: (aabb: AABB3) => boolean, callback: (shape: S) => void, depth: number = 0, max_depth: number = Infinity) {
        const hit = func(node.aabb);
        if (!hit) return;
        if (node.is_leaf || depth >= max_depth) {
            for (const shape of node.shapes) {
                callback(shape as S);
            }
            return;
        }
        const children_depth = depth + 1;
        if (node.left !== undefined) this.traverse_CallbackInternal(node.left, func, callback, children_depth, max_depth);
        if (node.right !== undefined) this.traverse_CallbackInternal(node.right, func, callback, children_depth, max_depth);
    }

    public *traverse_Iterator<S extends BuildShape = BuildShape>(func: (aabb: AABB3) => boolean, max_depth: number = Infinity) {
        if (this.root === undefined) return;
        yield* this.traverse_IteratorInternal<S>(this.root, func, 0, max_depth);
    }

    protected *traverse_IteratorInternal<S extends BuildShape>(node: BvhNode3<BuildShape>, func: (aabb: AABB3) => boolean, depth: number = 0, max_depth: number = Infinity): Generator<S> {
        const hit = func(node.aabb);
        if (!hit) return;
        if (node.is_leaf || depth >= max_depth) {
            for (const shape of node.shapes) {
                yield shape as S;
            }
            return;
        }
        const children_depth = depth + 1;
        if (node.left !== undefined) yield* this.traverse_IteratorInternal(node.left, func, children_depth, max_depth);
        if (node.right !== undefined) yield* this.traverse_IteratorInternal(node.right, func, children_depth, max_depth);
    }

    //#endregion
}

export class Bvh3 extends BaseBvh3<BvhShape3[], BvhShape3> {

    //#region init

    static get new() { return new Bvh3(); }

    //#endregion

    public build(shapes: BvhShape3[], max_depth: number = 16, strategy: Bvh3Strategy = Bvh3Strategy.Center) {
        if (!this.is_empty) {
            this.root = undefined;
            this.shape_aabbs = [];
            this.shape_aabbs_map.clear();
        }
        if (shapes === undefined || shapes.length === 0) return;
        
        const root_aabb = shapes[0].get_AABB(Box3.new) as AABB3;
        const first_aabb = root_aabb.clone();
        this.shape_aabbs.push(first_aabb);
        this.shape_aabbs_map.set(shapes[0], first_aabb);
        
        const count = shapes.length;
        for (let i = 1; i < count; i++) {
            const shape = shapes[i];
            const aabb = shape.get_AABB(Box3.new) as AABB3;
            this.shape_aabbs.push(aabb);
            this.shape_aabbs_map.set(shape, aabb);
            root_aabb.merge(root_aabb, aabb);
        }

        this.root = this.build_Internal(this.root, root_aabb, shapes, 0, max_depth, strategy);
    }
}

export class IndexBvh3 extends BaseBvh3<BvhIndexShape3, number> {

    //#region init

    static get new() { return new IndexBvh3(); }

    //#endregion

    public build(index_shape: BvhIndexShape3, max_depth: number = 16, strategy: Bvh3Strategy = Bvh3Strategy.Center) {
        if (!this.is_empty) {
            this.root = undefined;
            this.shape_aabbs = [];
            this.shape_aabbs_map.clear();
        }

        const root_aabb = index_shape.get_AABB(0, Box3.new) as AABB3;
        const first_aabb = root_aabb.clone();
        this.shape_aabbs.push(first_aabb);
        this.shape_aabbs_map.set(0, first_aabb);
        
        const count = index_shape.count;
        const shapes = new Array(count);
        shapes[0] = 0;
        for (let i = 1; i < count; i++) {
            const aabb = index_shape.get_AABB(i, Box3.new) as AABB3;
            shapes[i] = i;
            this.shape_aabbs.push(aabb);
            this.shape_aabbs_map.set(i, aabb);
            root_aabb.merge(root_aabb, aabb);
        }

        this.root = this.build_Internal(this.root, root_aabb, shapes, 0, max_depth, strategy);
    }
}