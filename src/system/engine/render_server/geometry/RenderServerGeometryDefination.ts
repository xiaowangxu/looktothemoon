import { WebGPURenderStateAttributeType, type WebGPURenderStateAttributeLayout } from "../../../sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";

export enum RenderServerGeometryAttributeLayoutBuffer {
    PositionNormal = 0,
    Tangent = 1,
    Color = 2,
    Uv = 3,
    InstanceTransformColor = 4,
    Uv2BoneWeight = 5,
    Custom0 = 6,
    Custom1 = 7,
}

export enum RenderServerGeometryAttributeLocation {
    Position = 0,
    Normal = 1,
    Tangent = 2,
    Color = 3,
    Uv = 4,
    InstanceTransformColorRow0 = 5,
    InstanceTransformColorRow1 = 6,
    InstanceTransformColorRow2 = 7,
    InstanceTransformColorRow3 = 8,
    Uv2 = 9,
    Bone = 10,
    Weight = 11,
    Custom0 = 12,
    Custom1 = 13,
    Custom2 = 14,
    Custom3 = 15,
}

export const RenderServerGeometryAttributeLayout: WebGPURenderStateAttributeLayout[] = [
    // Position
    {
        stride: 24, // 3 * 4 * 2
        per_instance: false,
        rows: [
            {
                location: RenderServerGeometryAttributeLocation.Position,
                offset: 0,
                type: WebGPURenderStateAttributeType.Vector3
            },
            {
                location: RenderServerGeometryAttributeLocation.Normal,
                offset: 12,
                type: WebGPURenderStateAttributeType.Vector3
            }
        ]
    },
    // Tangent
    {
        stride: 12, // 3 * 4
        per_instance: false,
        rows: [{
            location: RenderServerGeometryAttributeLocation.Tangent,
            offset: 0,
            type: WebGPURenderStateAttributeType.Vector3
        }]
    },
    // Color
    {
        stride: 16, // 3 * 4
        per_instance: false,
        rows: [{
            location: RenderServerGeometryAttributeLocation.Color,
            offset: 0,
            type: WebGPURenderStateAttributeType.Vector3
        }]
    },
    //  Uv
    {
        stride: 8, // 2 * 4
        per_instance: false,
        rows: [{
            location: RenderServerGeometryAttributeLocation.Uv,
            offset: 0,
            type: WebGPURenderStateAttributeType.Vector2
        }]
    },
    //  InstanceTransformColor
    {
        stride: 64, // 16 * 4
        per_instance: true,
        rows: [
            {
                location: RenderServerGeometryAttributeLocation.InstanceTransformColorRow0,
                offset: 0,
                type: WebGPURenderStateAttributeType.Matrix4Row
            },
            {
                location: RenderServerGeometryAttributeLocation.InstanceTransformColorRow1,
                offset: 16,
                type: WebGPURenderStateAttributeType.Matrix4Row
            },
            {
                location: RenderServerGeometryAttributeLocation.InstanceTransformColorRow2,
                offset: 32,
                type: WebGPURenderStateAttributeType.Matrix4Row
            },
            {
                location: RenderServerGeometryAttributeLocation.InstanceTransformColorRow3,
                offset: 48,
                type: WebGPURenderStateAttributeType.Matrix4Row
            }
        ]
    },
    //  Uv2BoneWeight
    {
        stride: 16, // 4 * 4
        per_instance: false,
        rows: [
            {
                location: RenderServerGeometryAttributeLocation.Uv2,
                offset: 0,
                type: WebGPURenderStateAttributeType.Vector2
            },
            {
                location: RenderServerGeometryAttributeLocation.Bone,
                offset: 8,
                type: WebGPURenderStateAttributeType.Uint
            },
            {
                location: RenderServerGeometryAttributeLocation.Weight,
                offset: 12,
                type: WebGPURenderStateAttributeType.Float
            },
        ]
    },
]