import type { MatrixLike } from "../linear_algebra/MatrixLike";

export interface CameraLike<Mat extends MatrixLike> {
    get projection(): Mat;
    get global_transform(): Mat;

    get mask(): number;
    
    get_Frustum(): any;
}