import { OrbitCamera3D } from '@/system/engine/nodes/camera_3ds/OrbitCamera3D';

export class EditorOrbitCamera3D extends OrbitCamera3D {
    public _ready(): void {
        this.visual_mask &= 0xfffffffe
        const viewport = this.get_Viewport();
        if (viewport) {
            viewport.get_Input().signal_mouse_entered.connect(() => this.visual_mask |= 1);
            viewport.get_Input().signal_mouse_leaved.connect(() => this.visual_mask &= 0xfffffffe);
        }
    }
}