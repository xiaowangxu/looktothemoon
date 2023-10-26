import { VisualInstance3D } from "./VisualInstance3D";

export class GeometryInstance3D extends VisualInstance3D {
    private _cast_shadow: boolean = false;
    public get cast_shadow() { return this._cast_shadow; }
    public set cast_shadow(cast: boolean) {
        if (this._cast_shadow !== cast) {
            this._cast_shadow = cast;
            this.on_CastShadowChanged();
        }
    }

    private _receive_shadow: boolean = false;
    public get receive_shadow() { return this._receive_shadow; }
    public set receive_shadow(receive: boolean) {
        if (this._receive_shadow !== receive) {
            this._receive_shadow = receive;
            this.on_ReceiveShadowChanged();
        }
    }

    constructor() {
        super();
    }

    protected on_CastShadowChanged() {
        throw new Error('abstract method');
    }

    protected on_ReceiveShadowChanged() {
        throw new Error('abstract method');
    }
}