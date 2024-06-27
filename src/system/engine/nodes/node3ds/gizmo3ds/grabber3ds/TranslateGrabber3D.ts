import { type Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { GrabberElement3D, Grabber3D } from "./Grabber3D";
import { LineGrabber3D } from "./LineGrabber3D";
import { PointGrabber3D } from "./PointGrabber3D";
import { Euler } from "@/system/fivepebble/linear_algebra/Euler";
import { Color } from "@/system/fivepebble/graphics/Color";

export class TranslateGrabber3D extends Grabber3D<Vector3> {
    private readonly axis_x_grabber: LineGrabber3D = new LineGrabber3D();
    private readonly axis_y_grabber: LineGrabber3D = new LineGrabber3D();
    private readonly axis_z_grabber: LineGrabber3D = new LineGrabber3D();
    private readonly center_grabber: PointGrabber3D = new PointGrabber3D();

    protected on_EnabledChanged(): void {
        this.axis_x_grabber.enabled = this.enabled;
        this.axis_y_grabber.enabled = this.enabled;
        this.axis_z_grabber.enabled = this.enabled;
        this.center_grabber.enabled = this.enabled;
    }

    protected on_VisibleChanged(): void {
        this.axis_x_grabber.visible = this.visible;
        this.axis_y_grabber.visible = this.visible;
        this.axis_z_grabber.visible = this.visible;
        this.center_grabber.visible = this.visible;
    }

    protected on_LayerChanged(): void {
        this.axis_x_grabber.layer = this._layer;
        this.axis_z_grabber.layer = this._layer;
        this.axis_z_grabber.layer = this._layer;
        this.center_grabber.layer = this._layer;
    }

    protected on_RenderQueueChanged(): void {
        this.axis_x_grabber.render_queue = this._render_queue;
        this.axis_y_grabber.render_queue = this._render_queue;
        this.axis_z_grabber.render_queue = this._render_queue;
        this.center_grabber.render_queue = this._render_queue;
    }

    constructor() {
        super();

        const red = 0xff3a46ff;
        const green = 0x4cff4dff;
        const blue = 0x466fffff;
        const grey = 0x606060ff;

        this.on_RenderQueueChanged();

        this.axis_x_grabber.local_rotation = Euler.create(0, 0, - Math.PI / 2);
        this.axis_x_grabber.color = Color.color8code(red);

        this.axis_y_grabber.color = Color.color8code(green);

        this.axis_z_grabber.local_rotation = Euler.create(Math.PI / 2, 0, 0);
        this.axis_z_grabber.color = Color.color8code(blue);

        this.center_grabber.color = Color.color8code(grey);

        this.add_Child(this.axis_x_grabber);
        this.add_Child(this.axis_y_grabber);
        this.add_Child(this.axis_z_grabber);
        this.add_Child(this.center_grabber);

        this.axis_x_grabber.signal_grab_start.connect((position: Vector3) => {
            this.axis_y_grabber.visible = false;
            this.axis_z_grabber.visible = false;
            this.center_grabber.enabled = false;
            this.signal_grab_start.trigger(position);
        });
        this.axis_y_grabber.signal_grab_start.connect((position: Vector3) => {
            this.axis_x_grabber.visible = false;
            this.axis_z_grabber.visible = false;
            this.center_grabber.enabled = false;
            this.signal_grab_start.trigger(position);
        });
        this.axis_z_grabber.signal_grab_start.connect((position: Vector3) => {
            this.axis_x_grabber.visible = false;
            this.axis_y_grabber.visible = false;
            this.center_grabber.enabled = false;
            this.signal_grab_start.trigger(position);
        });
        this.center_grabber.signal_grab_start.connect((position: Vector3) => {
            this.axis_x_grabber.visible = false;
            this.axis_y_grabber.visible = false;
            this.axis_z_grabber.visible = false;
            this.signal_grab_start.trigger(position);
        });


        const grabbing = (position: Vector3, target: GrabberElement3D<Vector3>) => {
            if (target !== this.center_grabber) {
                this.center_grabber.global_position = position;
            }
            this.signal_grabbing.trigger(position);
        }
        this.axis_x_grabber.signal_grabbing.connect(grabbing);
        this.axis_y_grabber.signal_grabbing.connect(grabbing);
        this.axis_z_grabber.signal_grabbing.connect(grabbing);
        this.center_grabber.signal_grabbing.connect(grabbing);

        const grab_end = (position: Vector3) => {
            this.local_position = position;
            this.axis_x_grabber.local_position = position;
            this.axis_y_grabber.local_position = position;
            this.axis_z_grabber.local_position = position;
            this.center_grabber.local_position = position;
            this.axis_x_grabber.visible = true;
            this.axis_y_grabber.visible = true;
            this.axis_z_grabber.visible = true;
            this.center_grabber.enabled = true;
            this.center_grabber.visible = true;
            this.signal_grab_end.trigger(position);
        }
        this.axis_x_grabber.signal_grab_end.connect(grab_end);
        this.axis_y_grabber.signal_grab_end.connect(grab_end);
        this.axis_z_grabber.signal_grab_end.connect(grab_end);
        this.center_grabber.signal_grab_end.connect(grab_end);
    }

    public set_TranslatePosition(position: Vector3) {
        this.local_position = position;
        this.axis_x_grabber.local_position = position;
        this.axis_y_grabber.local_position = position;
        this.axis_z_grabber.local_position = position;
        this.center_grabber.local_position = position;
    }
}