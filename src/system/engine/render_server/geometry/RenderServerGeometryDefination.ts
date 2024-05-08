import { WebGPURenderStateAttributeType, type WebGPURenderStateAttributeLayout } from "../../../sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";

export enum RenderServerGeometryAttributeLayoutBuffer {
    Position = 0,
    Normal = 1,
    Tangent = 2,
    Uv = 3,
    Uv2BoneWeight = 4,
    InstanceTransform = 5,
    Custom0 = 6,
    Custom1 = 7,
}

export enum RenderServerGeometryAttributeLocation {
    Position = 0,
    Normal = 1,
    Tangent = 2,
    Uv = 3,
    Uv2 = 4,
    Bone = 5,
    Weight = 6,
    InstanceTransformRow0 = 7,
    InstanceTransformRow1 = 8,
    InstanceTransformRow2 = 9,
    InstanceTransformRow3 = 10,
    Custom0 = 11,
    Custom1 = 12,
    Custom2 = 13,
    Custom3 = 14,
    Custom4 = 15,
}

export const RenderServerGeometryAttributeLayout: WebGPURenderStateAttributeLayout[] = [
    // Position
    {
        stride: 12, // 3 * 4
        per_instance: false,
        rows: [{
            location: RenderServerGeometryAttributeLocation.Position,
            offset: 0,
            type: WebGPURenderStateAttributeType.Vector3
        }]
    },
    // Normal
    {
        stride: 12, // 3 * 4
        per_instance: false,
        rows: [{
            location: RenderServerGeometryAttributeLocation.Normal,
            offset: 0,
            type: WebGPURenderStateAttributeType.Vector3
        }]
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
    //  BoneWeight
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
            }
        ]
    },
    //  InstanceTransform
    {
        stride: 64, // 16 * 4
        per_instance: false,
        rows: [
            {
                location: RenderServerGeometryAttributeLocation.InstanceTransformRow0,
                offset: 0,
                type: WebGPURenderStateAttributeType.Matrix4Row
            },
            {
                location: RenderServerGeometryAttributeLocation.InstanceTransformRow1,
                offset: 16,
                type: WebGPURenderStateAttributeType.Matrix4Row
            },
            {
                location: RenderServerGeometryAttributeLocation.InstanceTransformRow2,
                offset: 32,
                type: WebGPURenderStateAttributeType.Matrix4Row
            },
            {
                location: RenderServerGeometryAttributeLocation.InstanceTransformRow3,
                offset: 48,
                type: WebGPURenderStateAttributeType.Matrix4Row
            }
        ]
    }
]