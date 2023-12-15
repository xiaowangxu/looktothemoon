import { PickingWorld3D } from "./PickingWorld3D";
import { VisualWorld3D } from "./VisualWorld3D";
import { PhysicsWorld3D } from "./PhysicsWorld3D";
import type { SceneTree } from "../../SceneTree";

export class World3D {
    private readonly visual_world: VisualWorld3D = new VisualWorld3D();
    private readonly physics_world: PhysicsWorld3D = new PhysicsWorld3D();
    private readonly picking_world: PickingWorld3D = new PickingWorld3D();

    public get_VisualWorld() {
        return this.visual_world;
    }

    public get_PhysicsWorld() {
        return this.physics_world;
    }

    public get_PickingWorld() {
        return this.picking_world;
    }

    public trigger_BeforeRender(scene_tree: SceneTree) {
        this.get_VisualWorld()?.trigger_BeforeRender(scene_tree);
    }

    public dispose() {
        this.visual_world.dispose();
        this.physics_world.dispose();
        this.picking_world.dispose();
    }
}