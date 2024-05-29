import type { Config } from "@/system/engine/ConfiguredObject";
import { PackedIndexArray, PackedVector3Array } from "@/system/engine/classes/value_wrappers/PackedArray";
import { MeshInstance3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/geometry3ds/MeshInstance3D";
import { ArrayGeometryResource } from "@/system/engine/resources/geometry_resources/ArrayGeometryResource";
import { MatcapMaterialResource } from "@/system/engine/resources/material_resources/MatcapMaterial3DResource";
import type { Bvh3, BvhNode3 } from "@/system/fivepebble/bvh/Bvh3";
import type { AABB } from "@/system/fivepebble/bvh/BvhLike";
import type { Box3 } from "@/system/fivepebble/geometries/Box3";
import { Color } from "@/system/fivepebble/graphics/Color";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { type Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/render_state/RenderState";

export class Bvh3Visualization extends MeshInstance3D {
    constructor(config: Config) {
        super(config);
        this.material = new MatcapMaterialResource(config);
        (this.material as MatcapMaterialResource).color = Color.create(1, 0, 0, 1);
    }

    private append_AABB(aabb: AABB<Vector3, Matrix3>, points: number[], index: number[]) {
        const x0 = aabb.min.x, y0 = aabb.min.y, z0 = aabb.min.z;
        const x1 = aabb.max.x, y1 = aabb.max.y, z1 = aabb.max.z;
        const i0 = index.length / 3;
        const i1 = i0 + 1;
        const i2 = i1 + 1;
        const i3 = i2 + 1;
        const i4 = i3 + 1;
        const i5 = i4 + 1;
        const i6 = i5 + 1;
        const i7 = i6 + 1;
        points.push(
            x0, y0, z0,
            x0, y0, z1,
            x1, y0, z1,
            x1, y0, z0,

            x0, y1, z0,
            x0, y1, z1,
            x1, y1, z1,
            x1, y1, z0,
        );
        index.push(
            i0, i1,
            i1, i2,
            i2, i3,
            i3, i0,

            i0, i4,
            i1, i5,
            i2, i6,
            i3, i7,

            i4, i5,
            i5, i6,
            i6, i7,
            i7, i4,
        );
    }

    public visualize_Bvh3(bvh: Bvh3, depth: number) {
        if (bvh.root === undefined) {
            this.geometry = undefined;
            return;
        }
        const positions: number[] = [];
        const index: number[] = [];
        this.walk_Bvh(bvh.root, depth, positions, index);
        const geo = new ArrayGeometryResource(this.config);
        geo.set_Geometry(
            RenderStatePrimitiveType.Lines,
            {
                position: new PackedVector3Array(new Float32Array(positions)),
            },
            new PackedIndexArray(new Uint32Array(index)),
            undefined,
            RenderStateBufferUsage.StaticDraw,
            bvh.root.aabb as Box3
        );
        this.geometry = geo;
    }

    private walk_Bvh(bvh_node: BvhNode3, depth: number, points: number[], index: number[]) {
        const aabb = bvh_node.aabb;
        if (bvh_node.depth === depth || bvh_node.is_leaf) this.append_AABB(aabb, points, index);
        if (bvh_node.depth >= depth) return;
        if (bvh_node.left) this.walk_Bvh(bvh_node.left, depth, points, index);
        if (bvh_node.right) this.walk_Bvh(bvh_node.right, depth, points, index);
    }
}