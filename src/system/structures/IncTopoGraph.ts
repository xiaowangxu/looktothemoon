import { Result } from "../utils/Result";

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

        if (lower_bound < upper_bound) {
            const visited = new Set<IncTopoGraphNode<T>>();

            const changed_forward = this.dfs_Forward(succ, upper_bound, visited);

            if (changed_forward.failed) {
                prec.children.delete(succ);
                succ.parents.delete(prec);
                return changed_forward.error;
            }
            else {
                const nodes = changed_forward.value;
                const backward_nodes = this.dfs_Backward(prec, lower_bound, visited);
                IncTopoGraph.reorder(nodes, backward_nodes);
            }
        }

        return IncTopoGraphResult.Ok;
    }

    public has_Ref(item: T, dep: T) {
        const prec = this.nodes_map.get(dep);
        const succ = this.nodes_map.get(item);

        if (prec === undefined || succ === undefined) return false;

        if (prec === succ) return false;

        return prec.children.has(succ);
    }

    public has_IndirectRef(item: T, dep: T) {
        const prec = this.nodes_map.get(dep);
        const succ = this.nodes_map.get(item);

        if (prec === undefined || succ === undefined || prec === succ) return false;

        const stack: IncTopoGraphNode<T>[] = [];
        const visited = new Set<IncTopoGraphNode<T>>();

        stack.push(prec);
        while (stack.length > 0) {
            const key = stack.pop()!;
            if (visited.has(key)) continue;
            else { visited.add(key); }

            const children = key.children;

            if (children.has(succ)) {
                return true;
            }
            else {
                for (const child of children) {
                    stack.push(child);
                }
                continue;
            }
        }

        return false;
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

    public get unsorted() {
        return [...this.nodes_map.values()];
    }

    public get sorted() {
        return this.unsorted.sort((a, b) => a.order - b.order);
    }

    public get_UnsortedDescendants(item: T) {
        const result: IncTopoGraphNode<T>[] = [];
        const node = this.nodes_map.get(item);
        if (node === undefined) {
            return result;
        }

        const stack: IncTopoGraphNode<T>[] = [];
        const visited = new Set<IncTopoGraphNode<T>>();

        stack.push(node);
        while (stack.length > 0) {
            const key = stack.pop()!;
            if (visited.has(key)) continue;
            else { visited.add(key); }

            for (const child of key.children) {
                stack.push(child);
            }

            result.push(key);
        }

        return result;
    }

    public propagation(items: T[]) {
        const result: IncTopoGraphNode<T>[] = [];

        PriorityQueue < IncrementalTopoGraphNode<T>, TopoOrder > queue = new ();
        const visited: Set<IncTopoGraphNode<T>> = new Set();

        for (const item of items) {
            const node = this.nodes_map.get(item);
            if (node !== undefined) {
                queue.Enqueue(node, node.order);
            }
        }

        while (true) {
            if (queue.Count <= 0) break;
            const key: IncTopoGraphNode<T> = queue.Dequeue();
            if (visited.has(key)) continue;
            else { visited.add(key); }

            for (const child of key.children) {
                queue.Enqueue(child, child.order);
            }

            result.push(key);
        }

        return result;
    }

    private dfs_Forward(root: IncTopoGraphNode<T>, upper_bound: TopoOrder, visited: Set<IncTopoGraphNode<T>>): Result<IncTopoGraphNode<T>[], IncTopoGraphResult> {
        const result: IncTopoGraphNode<T>[] = [];
        const stack: IncTopoGraphNode<T>[] = [];

        stack.push(root);
        while (stack.length > 0) {
            const node = stack.pop()!;

            visited.add(node);
            result.push(node);

            for (const child of node.children) {
                const order = child.order;

                if (order == upper_bound) {
                    return Result.Error(IncTopoGraphResult.CyclicReference);
                }

                if (!visited.has(child) && order < upper_bound) {
                    stack.push(child);
                }
            }
        }

        return Result.Ok(result);
    }

    private dfs_Backward(root: IncTopoGraphNode<T>, lower_bound: TopoOrder, visited: Set<IncTopoGraphNode<T>>): IncTopoGraphNode<T>[] {
        const result: IncTopoGraphNode<T>[] = [];
        const stack: IncTopoGraphNode<T>[] = [];

        stack.push(root);
        while (stack.length > 0) {
            const node = stack.pop()!;

            visited.add(node);
            result.push(node);

            for (const parent of node.parents) {
                const order = parent.order;

                if (!visited.has(parent) && lower_bound < order) {
                    stack.push(parent);
                }
            }
        }

        return result;
    }

    private static sort<T>(a: IncTopoGraphNode<T>, b: IncTopoGraphNode<T>) {
        if (a.order < b.order) return -1;
        else if (a.order > b.order) return 1;
        return 0;
    }
    private static reorder<T>(forward: IncTopoGraphNode<T>[], backward: IncTopoGraphNode<T>[]) {
        forward.sort(IncTopoGraph.sort);
        backward.sort(IncTopoGraph.sort);

        var orders = [...backward.map(n => n.order), ...forward.map(n => n.order)].sort();
        var nodes = [...backward, ...forward];

        orders.forEach((order, idx) => {
            nodes[idx].order = order;
        });
    }
}