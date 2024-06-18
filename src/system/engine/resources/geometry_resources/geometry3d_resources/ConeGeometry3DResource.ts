import type { ResourceSetOptionAllAtOnce } from "../../Resource";
import { CylinderGeometry3DResource, type CylinderGeometry3DResourceOption } from "./CylinderGeometry3DResource";

type ConeGeometry3DResourceOption = Omit<CylinderGeometry3DResourceOption, 'top_radius'>;

export class ConeGeometry3DResource extends CylinderGeometry3DResource implements ResourceSetOptionAllAtOnce<ConeGeometry3DResourceOption> {

    public get top_radius() { return this._top_radius; }
    private set top_radius(radius: number) { return; }

    public set option(option: ConeGeometry3DResourceOption) {
        super.option = option;
    }

    constructor() {
        super();
        super.top_radius = 0;
        this.build();
    }

    protected dispose(): void {
        super.dispose();
    }
}