import { IncTopoGraph, IncTopoGraphResult } from '../structures/IncTopoGraph';
import type { RenderingDevice } from './RenderingDevice';
import type { FramePassBase } from './FramePass';

export class RenderGraph {
    public readonly rd: RenderingDevice;
    private readonly graph: IncTopoGraph<FramePassBase> = new IncTopoGraph();

    private framepass_list: FramePassBase[] = [];

    constructor(rd: RenderingDevice) {
        this.rd = rd;
    }

    public resize(width: number, height: number) {
        for (const framepass of this.graph.unsorted) {
            framepass.item.resize(width, height);
        }
    }

    private update_FramePassList() {
        this.framepass_list = this.graph.sorted.map(n => n.item);
    }
    
    public create_FramePass<T extends new (rg: RenderGraph, name: string, on_screen: boolean) => FramePassBase>(framepass_class: T, name: string, on_screen: boolean): InstanceType<T> {
        const framepass = new framepass_class(this, name, on_screen) as InstanceType<T>; 
        this.graph.add(framepass);
        this.update_FramePassList();
        return framepass;
    }

    public link_FramePass(framepass: FramePassBase, deps: FramePassBase[]) {
        for (const dep of deps) {
            const result = this.graph.ref(framepass, dep);
            if (result !== IncTopoGraphResult.Ok) throw new Error('fail to add frame pass deps error');
        }
        this.update_FramePassList();
    }

    public render() {
        for (const pass of this.framepass_list) {
            pass.use();
            pass.render();
            pass.end();
        }
    }

    public dispose() {
        for (const framepass of this.graph.unsorted) {
            framepass.item.dispose();
        }
        this.framepass_list = [];
        this.graph.clear();
    }
}