import { Epsilon } from "../Scalar";
import type { BoxLike } from "../geometries/BoxLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";

type AABB<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> = BoxLike<Vec, Mat>;

export interface BvhShape<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get bbox(): AABB<Vec, Mat>;
}

class BvhNode<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    public parent: BvhNode<Vec, Mat> | undefined;
    public depth: number = 0;
    public readonly aabb: AABB<Vec, Mat>;
    public shapes: number[] | undefined;
    // children
    public left: BvhNode<Vec, Mat> | undefined = undefined;
    public right: BvhNode<Vec, Mat> | undefined = undefined;

    public get is_leaf() { return this.shapes === undefined; }

    constructor(
        parent: BvhNode<Vec, Mat> | undefined,
        depth: number,
        aabb: AABB<Vec, Mat>,
        shapes: number[] | undefined,
        left: BvhNode<Vec, Mat> | undefined = undefined,
        right: BvhNode<Vec, Mat> | undefined = undefined,
    ) {
        this.parent = parent;
        this.depth = depth;
        this.aabb = aabb;
        this.shapes = shapes;
        this.left = left;
        this.right = right;
    }
}

export class Bvh<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    private readonly _empty_aabb: AABB<Vec, Mat>;
    private get empty_aabb() { return this._empty_aabb.clone(); }

    private root: BvhNode<Vec, Mat> | undefined;

    private shapes: BvhShape<Vec, Mat>[] = [];
    private aabbs: AABB<Vec, Mat>[] = [];

    constructor(empty_aabb: AABB<Vec, Mat>) {
        this._empty_aabb = empty_aabb;
    }

    public build(shapes: BvhShape<Vec, Mat>[]) {
        this.shapes = shapes;
        this.aabbs = this.shapes.map(s => s.bbox);
        this.root = undefined;
        const shapes_count = this.shapes.length;
        if (shapes_count === 0) return;
        this.build_Internal(this.root, 0, 0, shapes_count - 1);
    }

    private build_Internal(parent: BvhNode<Vec, Mat> | undefined, depth: number, low: number, high: number) {
        if (low > high) return;
        if (low === high) {
            // only one shape
            const aabb = this.aabbs[low];
            const node = new BvhNode<Vec, Mat>(parent, depth, aabb, [low], undefined, undefined);
            return node;
        }
        else {
            // first compute aabb and center to split bvh
            const centroid_bounds = this.aabbs[low].clone();
            const aabb_bounds = centroid_bounds.clone();
            const center = this.aabbs[low].center;
            centroid_bounds.set(center, center);

            for (let i = low + 1; i <= high; i++) {
                const aabb = this.aabbs[i];
                aabb.gets_Center(center);
                centroid_bounds.grows(centroid_bounds, center);
                aabb_bounds.merges(aabb_bounds, aabb);
            }

            const split_axis_size = centroid_bounds.size.max_component;

            if (split_axis_size < Epsilon) {

            }
        }
    }
}