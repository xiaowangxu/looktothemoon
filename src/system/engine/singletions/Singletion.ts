import { SceneTree } from "../SceneTree";

export class Singletion {
    public static readonly singleton_name: string = "Singleton";

    public readonly scene_tree: SceneTree;

    constructor(scene_tree: SceneTree) {
        this.scene_tree = scene_tree;
    }

    public dispose(): void { }
}