import { ConfiguredObject, type Config } from "../ConfiguredObject";
import { SceneTree } from "../SceneTree";

export class Singletion extends ConfiguredObject {
    public static readonly singleton_name: string = "Singleton";

    public readonly scene_tree: SceneTree;

    constructor(config: Config, scene_tree: SceneTree) {
        super(config);
        this.scene_tree = scene_tree;
    }
}