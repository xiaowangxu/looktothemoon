import { WebGPURenderStateAttributeRowType, type WebGPURenderStateAttributeLayout } from "../../render_state_object/pipeline/WebGPURenderStateAttributeLayout";

export enum WebGPURenderElementGeometryAttributeLayoutBuffer {
    Position = 0,
    Normal = 1,
    Tangent = 2,
    Uv = 3,
    Uv2BoneWeight = 4,
    InstanceTransform = 5,
    Custom0 = 6,
    Custom1 = 7,
}

export enum WebGPURenderElementGeometryAttributeLocation {
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

export const WebGPURenderElementGeometryAttributeLayout: WebGPURenderStateAttributeLayout[] = [
    // Position
    {
        stride: 12, // 3 * 4
        per_instance: false,
        rows: [{
            location: WebGPURenderElementGeometryAttributeLocation.Position,
            offset: 0,
            type: WebGPURenderStateAttributeRowType.Vector3
        }]
    },
    // Normal
    {
        stride: 12, // 3 * 4
        per_instance: false,
        rows: [{
            location: WebGPURenderElementGeometryAttributeLocation.Normal,
            offset: 0,
            type: WebGPURenderStateAttributeRowType.Vector3
        }]
    },
    // Tangent
    {
        stride: 12, // 3 * 4
        per_instance: false,
        rows: [{
            location: WebGPURenderElementGeometryAttributeLocation.Tangent,
            offset: 0,
            type: WebGPURenderStateAttributeRowType.Vector3
        }]
    },
    //  Uv
    {
        stride: 8, // 2 * 4
        per_instance: false,
        rows: [{
            location: WebGPURenderElementGeometryAttributeLocation.Uv,
            offset: 0,
            type: WebGPURenderStateAttributeRowType.Vector2
        }]
    },
    //  BoneWeight
    {
        stride: 16, // 4 * 4
        per_instance: false,
        rows: [
            {
                location: WebGPURenderElementGeometryAttributeLocation.Uv2,
                offset: 0,
                type: WebGPURenderStateAttributeRowType.Vector2
            },
            {
                location: WebGPURenderElementGeometryAttributeLocation.Bone,
                offset: 8,
                type: WebGPURenderStateAttributeRowType.Uint
            },
            {
                location: WebGPURenderElementGeometryAttributeLocation.Weight,
                offset: 12,
                type: WebGPURenderStateAttributeRowType.Float
            }
        ]
    },
    //  InstanceTransform
    {
        stride: 64, // 16 * 4
        per_instance: false,
        rows: [
            {
                location: WebGPURenderElementGeometryAttributeLocation.InstanceTransformRow0,
                offset: 0,
                type: WebGPURenderStateAttributeRowType.Matrix4Row
            },
            {
                location: WebGPURenderElementGeometryAttributeLocation.InstanceTransformRow1,
                offset: 16,
                type: WebGPURenderStateAttributeRowType.Matrix4Row
            },
            {
                location: WebGPURenderElementGeometryAttributeLocation.InstanceTransformRow2,
                offset: 32,
                type: WebGPURenderStateAttributeRowType.Matrix4Row
            },
            {
                location: WebGPURenderElementGeometryAttributeLocation.InstanceTransformRow3,
                offset: 48,
                type: WebGPURenderStateAttributeRowType.Matrix4Row
            }
        ]
    }
]