import { WebGPURenderStateAttributeRowType, type WebGPURenderStateAttributeLayout } from "../../render_state_object/pipeline/WebGPURenderStateAttributeLayout";

export enum WebGPURenderElementGeometryAttributeLayoutLocation {
    Position = 1 << 0,
    Normal = 1 << 1,
    Tangent = 1 << 2,
    Uv = 1 << 3,
    BoneWeight = 1 << 4,
    InstanceTransform = 1 << 5,
    Custom0 = 1 << 6,
    Custom1 = 1 << 7,
}

export enum WebGPURenderElementGeometryAttributeLocation {
    Position = 0,
    Normal = 1,
    Tangent = 2,
    Color = 3,
    Uv = 4,
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
        stride: 8, // 2 * 4
        per_instance: false,
        rows: [
            {
                location: WebGPURenderElementGeometryAttributeLocation.Bone,
                offset: 0,
                type: WebGPURenderStateAttributeRowType.Uint
            },
            {
                location: WebGPURenderElementGeometryAttributeLocation.Weight,
                offset: 4,
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