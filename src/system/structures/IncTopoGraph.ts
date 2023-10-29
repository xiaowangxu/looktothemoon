type TopoOrder = number;

class IncTopoGraphNode<T> {
    public readonly item: T;
    public order: TopoOrder;
    public readonly parents: Set<IncTopoGraphNode<T>> = new Set();
    public readonly children: Set<IncTopoGraphNode<T>> = new Set();

    public get is_single() { return this.parents.size === 0 && this.children.size === 0; }
    public get dep_count() { return this.parents.size; }
    public get support_count() { return this.children.size; }

    constructor(order: TopoOrder, item: T) {
        this.order = order;
        this.item = item;
    }
}

export enum IncTopoGraphResult {
    Ok, Existed, NodesMissing, CyclicReference,
}

export class IncTopoGraph<T> {
    private last_order: TopoOrder = 0;
    private readonly nodes_map: Map<T, IncTopoGraphNode<T>> = new Map();

    public get count() { return this.nodes_map.size; }

    constructor() {

    }

    public add(item: T) {
        const node = this.nodes_map.get(item);
        if (node !== undefined) return node;
        this.last_order++;
        const new_node = new IncTopoGraphNode(this.last_order, item);
        this.nodes_map.set(item, new_node);
        return new_node;
    }

    public has(item: T) { return this.nodes_map.has(item); }

    public remove(item: T): boolean {
        if (!this.has(item)) return false;

        const node = this.nodes_map.get(item)!;
        this.nodes_map.delete(item);

        for (const child of node.children) {
            child.parents.delete(node);
        }

        for (const parent of node.parents) {
            parent.children.delete(node);
        }

        for (const other_node of this.nodes_map.values()) {
            if (other_node.order > node.order) {
                other_node.order--;
            }
        }

        this.last_order--;
        return true;
    }

    public is_Single(item: T) {
        return this.nodes_map.get(item)?.is_single ?? false;
    }

    public get_DepCount(item: T) {
        return this.nodes_map.get(item)?.dep_count ?? 0;
    }

    public get_Deps(item: T) {
        const node = this.nodes_map.get(item);
        if (node === undefined) return [];
        return [...node.parents].map(p => p.item);
    }

    public get_SupportCount(item: T) {
        return this.nodes_map.get(item)?.support_count ?? 0;
    }

    public get_Supports(item: T) {
        const node = this.nodes_map.get(item);
        if (node === undefined) return [];
        return [...node.children].map(p => p.item);
    }

    public ref(item: T, dep: T) {
        const prec = this.nodes_map.get(dep);
        const succ = this.nodes_map.get(item);

        if (prec === undefined || succ === undefined) return IncTopoGraphResult.NodesMissing;

        if (prec === succ) return IncTopoGraphResult.CyclicReference;

        let no_prev_edge = !prec.children.has(succ);
        if (no_prev_edge) prec.children.add(succ);
        const upper_bound = prec.order;

        const not_has_prec = !succ.parents.has(prec);
        if (not_has_prec) succ.parents.add(prec);
        no_prev_edge = no_prev_edge && not_has_prec;
        const lower_bound = succ.order;

        if (!no_prev_edge) return IncTopoGraphResult.Existed;

        // if (lower_bound < upper_bound) {
        //     const visited = new Set<IncTopoGraphNode<T>>();

        //     Result < List<IncrementalTopoGraphNode<T>>, ErrorResult > changed_forward = this.ForwardDFS(succ, upper_bound, visited);

        //     if (changed_forward.Failed) {
        //         prec.Children.Remove(succ);
        //         succ.Parents.Remove(prec);
        //         return Err<bool, ErrorResult>(changed_forward.Error);
        //     }
        //     else {
        //         List < IncrementalTopoGraphNode < T >> nodes = changed_forward.Unwrap();
        //         List < IncrementalTopoGraphNode < T >> backward_nodes = this.BackwardDFS(prec, lower_bound, visited);
        //         IncrementalTopoGraph<T>.ReorderNodes(nodes, backward_nodes);
        //     }
        // }

        return IncTopoGraphResult.Ok;
    }

    public has_Ref(item: T, dep: T) {
        const prec = this.nodes_map.get(dep);
        const succ = this.nodes_map.get(item);

        if (prec === undefined || succ === undefined) return false;

        if (prec === succ) return false;

        return prec.children.has(succ);
    }

    public unref(item: T, dep: T) {
        const prec = this.nodes_map.get(dep);
        const succ = this.nodes_map.get(item);

        if (prec === undefined || succ === undefined || prec === succ) return false;

        const prec_children = prec.children;

        if (!prec_children.has(succ)) return false;

        prec_children.delete(succ);
        succ.parents.delete(prec);

        return true;
    }
}