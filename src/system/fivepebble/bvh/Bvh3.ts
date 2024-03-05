import { type BvhLike, type BvhShape } from "./BvhLike";
import { Vector3 } from "../linear_algebra/Vector3";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import { Box3 } from "../geometries/Box3";
import { Epsilon } from "../Scalar";
import type { Ray3 } from "../geometries/Ray3";

export class BvhNode3 {
    public parent: BvhNode3 | undefined;
    public depth: number = 0;
    public readonly aabb: AABB3;
    public shapes: BvhShape<Vector3, Matrix3>[];
    // children
    public left: BvhNode3 | undefined = undefined;
    public right: BvhNode3 | undefined = undefined;

    public get is_leaf() { return this.left === undefined && this.right === undefined; }

    constructor(
        parent: BvhNode3 | undefined,
        depth: number,
        aabb: AABB3,
        shapes: BvhShape<Vector3, Matrix3>[],
        left: BvhNode3 | undefined = undefined,
        right: BvhNode3 | undefined = undefined,
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

type AABB3 = Box3;

export class Bvh3 implements BvhLike<Vector3, Matrix3> {
    private readonly max_depth: number;

    public root: BvhNode3 | undefined;
    private shape_aabbs_map: Map<BvhShape<Vector3, Matrix3>, AABB3> = new Map();
    private shape_aabbs: AABB3[] = [];

    constructor(max_depth: number = 16) {
        this.max_depth = max_depth;
    }

    public build(shapes: BvhShape<Vector3, Matrix3>[]) {
        this.root = undefined;
        this.shape_aabbs = [];
        this.shape_aabbs_map.clear();
        if (shapes.length === 0) return;
        const root_aabb = shapes[0].aabb as AABB3;
        for (const shape of shapes) {
            const aabb = shape.aabb as AABB3;
            this.shape_aabbs.push(aabb);
            this.shape_aabbs_map.set(shape, aabb);
            root_aabb.merge(root_aabb, aabb);
        }
        this.root = this.build_Internal(this.root, root_aabb, shapes, 0);
    }

    static readonly #vector3: Vector3 = Vector3.new;
    static readonly #centroid: AABB3 = Box3.new;

    private get_CentriodAABB(shapes: BvhShape<Vector3, Matrix3>[], target: AABB3) {
        let cminx = Infinity;
        let cminy = Infinity;
        let cminz = Infinity;
        let cmaxx = - Infinity;
        let cmaxy = - Infinity;
        let cmaxz = - Infinity;
        for (let i = 0; i < shapes.length; i++) {
            const aabb = this.shape_aabbs_map.get(shapes[i])!;
            const center = aabb.get_Center(Bvh3.#vector3);
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

    private static get_LongestAxis(aabb: AABB3): [Bvh3Axis, length: number] {
        const a = aabb.max.x - aabb.min.x; // x
        const b = aabb.max.y - aabb.min.y; // y
        const c = aabb.max.z - aabb.min.z; // z
        if ((a >= b) && (a >= c)) {
            return [Bvh3Axis.X, a];
        }
        else if ((b >= a) && (b >= c)) {
            return [Bvh3Axis.Y, b];
        }
        else {
            return [Bvh3Axis.Z, c];
        }
    }

    private get_OptimalSplit(parent_aabb: AABB3, centroid_aabb: AABB3): [Bvh3Axis, pos: number] | undefined {
        // Center
        const [axis, length] = Bvh3.get_LongestAxis(centroid_aabb);
        if (length < Epsilon) return undefined;
        let pos: number;
        switch (axis) {
            case Bvh3Axis.X: {
                pos = (centroid_aabb.min.x + centroid_aabb.max.x) / 2;
                break;
            }
            case Bvh3Axis.Y: {
                pos = (centroid_aabb.min.y + centroid_aabb.max.y) / 2;
                break;
            }
            case Bvh3Axis.Z: {
                pos = (centroid_aabb.min.z + centroid_aabb.max.z) / 2;
                break;
            }
        }
        return [axis, pos];
        // else if (strategy === AVERAGE) {
        //     axis = getLongestEdgeIndex(nodeBoundingData);
        //     if (axis !== - 1) {
        //         pos = getAverage(triangleBounds, offset, count, axis);
        //     }
        // } else if (strategy === SAH) {

        //     const rootSurfaceArea = computeSurfaceArea(nodeBoundingData);
        //     let bestCost = TRIANGLE_INTERSECT_COST * count;

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

        //                     leftProb = computeSurfaceArea(leftBounds) / rootSurfaceArea;

        //                 }

        //                 let rightProb = 0;
        //                 if (rightCount !== 0) {

        //                     rightProb = computeSurfaceArea(rightBounds) / rootSurfaceArea;

        //                 }

        //                 const cost = TRAVERSAL_COST + TRIANGLE_INTERSECT_COST * (
        //                     leftProb * leftCount + rightProb * rightCount
        //                 );

        //                 if (cost < bestCost) {

        //                     axis = a;
        //                     bestCost = cost;
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

        //                     leftProb = computeSurfaceArea(leftBounds) / rootSurfaceArea;

        //                 }

        //                 const rightCount = count - leftCount;
        //                 if (rightCount !== 0) {

        //                     rightProb = computeSurfaceArea(rightBounds) / rootSurfaceArea;

        //                 }

        //                 const cost = TRAVERSAL_COST + TRIANGLE_INTERSECT_COST * (
        //                     leftProb * leftCount + rightProb * rightCount
        //                 );

        //                 if (cost < bestCost) {

        //                     axis = a;
        //                     bestCost = cost;
        //                     pos = bin.candidate;

        //                 }

        //             }

        //         }

        //     }

        // }
        // return { axis, pos };
    }

    private static get_Axis(vec: Vector3, axis: Bvh3Axis) {
        switch (axis) {
            case Bvh3Axis.X: return vec.x;
            case Bvh3Axis.Y: return vec.y;
            case Bvh3Axis.Z: return vec.z;
        }
    }

    private static get_SurfaceArea(aabb: AABB3) {
        const x = aabb.max.x - aabb.min.x;
        const y = aabb.max.y - aabb.min.y;
        const z = aabb.max.z - aabb.min.z;
        return 2 * (x * y + y * z + z * x);
    }

    private static is_RayIntersectedAABB(aabb: AABB3, ray: Ray3) {
        const vmin = aabb.min, vmax = aabb.max;
        const rdir = ray.direction, rpos = ray.origin;
        const t1 = (vmin.x - rpos.x) / rdir.x;
        const t2 = (vmax.x - rpos.x) / rdir.x;
        const t3 = (vmin.y - rpos.y) / rdir.y;
        const t4 = (vmax.y - rpos.y) / rdir.y;
        const t5 = (vmin.z - rpos.z) / rdir.z;
        const t6 = (vmax.z - rpos.z) / rdir.z;

        const aMin = t1 < t2 ? t1 : t2;
        const bMin = t3 < t4 ? t3 : t4;
        const cMin = t5 < t6 ? t5 : t6;

        const aMax = t1 > t2 ? t1 : t2;
        const bMax = t3 > t4 ? t3 : t4;
        const cMax = t5 > t6 ? t5 : t6;

        const fMax = aMin > bMin ? aMin : bMin;
        const fMin = aMax < bMax ? aMax : bMax;

        const t7 = fMax > cMin ? fMax : cMin;
        const t8 = fMin < cMax ? fMin : cMax;

        return (t8 < 0 || t7 > t8) ? false : t7 > 0;
    }

    private build_Internal(parent: BvhNode3 | undefined, parent_aabb: AABB3, shapes: BvhShape<Vector3, Matrix3>[], depth: number): BvhNode3 | undefined {
        const count = shapes.length;
        if (count === 0) return undefined;
        if (count === 1) {
            const node = new BvhNode3(parent, depth, parent_aabb, shapes, undefined, undefined);
            return node;
        }
        if (depth > this.max_depth) {
            const node = new BvhNode3(parent, depth, parent_aabb, shapes, undefined, undefined);
            return node;
        }
        const centroid_aabb = this.get_CentriodAABB(shapes, Bvh3.#centroid);
        // split
        const split = this.get_OptimalSplit(parent_aabb, centroid_aabb);
        if (split === undefined) {
            // can not split further
            const node = new BvhNode3(parent, depth, parent_aabb, shapes, undefined, undefined);
            return node;
        }
        else {
            const [axis, pos] = split;
            // can split
            const left = [];
            const right = [];
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
                const axis_center = Bvh3.get_Axis(center, axis);
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
            node.left = this.build_Internal(node, Box3.create(Vector3.create(left_minx, left_miny, left_minz), Vector3.create(left_maxx, left_maxy, left_maxz)), left, depth + 1);
            node.right = this.build_Internal(node, Box3.create(Vector3.create(right_minx, right_miny, right_minz), Vector3.create(right_maxx, right_maxy, right_maxz)), right, depth + 1);
            return node;
        }
    }
}