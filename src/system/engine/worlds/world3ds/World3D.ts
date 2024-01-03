import { PickingWorld3D } from "./PickingWorld3D";
import { VisualWorld3D } from "./VisualWorld3D";
import { PhysicsWorld3D } from "./PhysicsWorld3D";
import type { SceneTree } from "../../SceneTree";
import { Resource } from "../../resources/Resource";

export class World3D extends Resource {
    public readonly visual_world: VisualWorld3D = new VisualWorld3D(this.config);
    public readonly physics_world: PhysicsWorld3D = new PhysicsWorld3D(this.config);
    public readonly picking_world: PickingWorld3D = new PickingWorld3D(this.config);

    public trigger_BeforeRender(scene_tree: SceneTree) {
        this.visual_world?.trigger_BeforeRender(scene_tree);
    }

    public dispose() {
        this.visual_world.dispose();
        this.physics_world.dispose();
        this.picking_world.dispose();
    }
}