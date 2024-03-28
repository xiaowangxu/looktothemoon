import { Result } from "@/system/utils/Result";
import { Edge, type VertexDiskLoop } from "./Edge";
import { Face } from "./Face";
import { Loop } from "./Loop";
import { Vertex } from "./Vertex";

export class Shape<V extends Vertex = Vertex, E extends Edge = Edge, L extends Loop = Loop, F extends Face = Face> {
    private readonly vertices: Set<V> = new Set();
    private readonly edges: Set<E> = new Set();
    private readonly loops: Set<L> = new Set();
    private readonly faces: Set<F> = new Set();
    private readonly vertex_constructor: new () => V;
    private readonly edge_constructor: new (v0: V, v1: V) => E;
    private readonly loop_constructor: new (v: V, e: E, f: F) => L;
    private readonly face_constructor: new () => F;

    constructor(
        vertex_constructor: new () => V,
        edge_constructor: new (v0: V, v1: V) => E,
        loop_constructor: new (v: V, e: E, f: F) => L,
        face_constructor: new () => F,
    ) {
        this.vertex_constructor = vertex_constructor;
        this.edge_constructor = edge_constructor;
        this.loop_constructor = loop_constructor;
        this.face_constructor = face_constructor;
    }

    // #region Vertex

    public has_Vertex(v: V) {
        return this.vertices.has(v);
    }

    public create_Vertex() {
        const vertex = new this.vertex_constructor();
        this.vertices.add(vertex);
        return vertex;
    }

    public get_VertexEdgesCount(v: V) {
        let count = 0;
        let e_iter = v.edge;
        do {
            if (e_iter === undefined) break;
            count++;
        }
        while ((e_iter = this._Edge_get_VertexNextEdge(e_iter, v)) !== v.edge);
        return count;
    }

    public get_VertexEdges(v: V) {
        const edges: Edge[] = [];
        let e_iter = v.edge;
        do {
            if (e_iter === undefined) break;
            edges.push(e_iter);
        }
        while ((e_iter = this._Edge_get_VertexNextEdge(e_iter, v)) !== v.edge);
        return edges as E[];
    }

    protected _Vertex_add_Edge(v: V, e: E) {
        if (v.edge === undefined) {
            // a new edge
            const vert_disk_loop = this._Edge_get_VertexDiskLoop(e, v);
            v.edge = e;
            // self loop
            vert_disk_loop.next_edge = vert_disk_loop.prev_edge = e;
        }
        else {
            // already has other edges
            // attach to the vertex disk loop

            //  ^   | |
            //  |    * --->   <----- v.edge.vertex_disk_loop [vert_disk_loop_1]
            //  |   | |   |  next
            //  |   | |   *   <----- new edge [vert_disk_loop_0]
            //  |   | |   |  prev
            //  |    * ---<   <----- vert_disk_loop_1.
            //  |   | |

            // self disk loop
            const vert_disk_loop_0 = this._Edge_get_VertexDiskLoop(e, v);
            // vertex's disk loop
            const vert_disk_loop_1 = this._Edge_get_VertexDiskLoop(v.edge, v);

            // insert new edge to disk loop
            vert_disk_loop_0.next_edge = v.edge;
            vert_disk_loop_0.prev_edge = vert_disk_loop_1.prev_edge;

            // redirect old loop's prev / next
            const vert_disk_loop_2 = this._Edge_get_VertexDiskLoop(vert_disk_loop_1.prev_edge, v);
            vert_disk_loop_1.prev_edge = e;
            vert_disk_loop_2.next_edge = e;
        }
    }

    protected _Vertex_delete_Edge(v: V, e: E) {
        // find remove edge's vertex disk loop
        const vertex_disk_loop_0 = this._Edge_get_VertexDiskLoop(e, v);

        // it's prev.next -> it's next
        const vertex_disk_loop_1 = this._Edge_get_VertexDiskLoop(vertex_disk_loop_0.prev_edge, v);
        vertex_disk_loop_1.next_edge = vertex_disk_loop_0.next_edge;
        // it's next.prev -> it's prev
        const vertex_disk_loop_2 = this._Edge_get_VertexDiskLoop(vertex_disk_loop_0.next_edge, v);
        vertex_disk_loop_2.prev_edge = vertex_disk_loop_0.prev_edge;

        // if vertex -> edeg is remove edge set it to next edge
        if (v.edge === e) {
            // if v.edge is the only edge set edge to undefined
            v.edge = (e !== vertex_disk_loop_0.next_edge) ? vertex_disk_loop_0.next_edge : undefined;
        }

        // initialize not pointing to vertex
        vertex_disk_loop_0.next_edge = vertex_disk_loop_0.prev_edge = e;
    }

    // #endregion

    // #region Edge

    public has_Edge(e: E) {
        return this.edges.has(e);
    }

    public create_Edge(v0: V, v1: V): Result<E, Error> {
        if (!this.has_Vertex(v0) || !this.has_Vertex(v1)) return Result.Error(new Error('<Shape> create_Edge: v0 or v1 are not valid'));
        if (v0 === v1) return Result.Error(new Error('<Shape> create_Edge: v0 and v1 are the same vertex, self loop is currently not supported'));
        const edge = new this.edge_constructor(v0, v1);
        this.edges.add(edge);
        this._Vertex_add_Edge(v0, edge);
        this._Vertex_add_Edge(v1, edge);
        return Result.Ok(edge);
    }

    public get_EdgeVertices(e: E) {
        return [e.vertex_0, e.vertex_1] as [V, V];
    }

    public is_EdgeExist(v0: V, v1: V, reverseable: boolean = false) {
        let e_iter = v0.edge;
        do {
            if (e_iter === undefined) break;
            if (
                e_iter.vertex_0 === v0 && e_iter.vertex_1 === v1 ||
                (reverseable && e_iter.vertex_0 === v1 && e_iter.vertex_1 === v0)
            ) return true;
        }
        while ((e_iter = this._Edge_get_VertexNextEdge(e_iter, v0)) !== v0.edge);
        return false;
    }

    public get_EdgeFaces(e: E) {
        const faces: Face[] = [];
        let l_iter = e.loop;
        do {
            if (l_iter === undefined) break;
            faces.push(l_iter.face);
        }
        while ((l_iter = l_iter.radial_next_loop) !== e.loop);
        return faces as F[];
    }

    public get_EdgeFacesCount(e: E) {
        let count = 0;
        let l_iter = e.loop;
        do {
            if (l_iter === undefined) break;
            count++;
        }
        while ((l_iter = l_iter.radial_next_loop) !== e.loop);
        return count;
    }

    protected _Edge_has_Vertex(e: Edge, v: Vertex) {
        return e.vertex_0 === v || e.vertex_1 === v;
    }

    /**
     * this will not check vertex's existance
     */
    protected _Edge_get_OppositeVertex(e: Edge, v: Vertex) {
        return (e.vertex_0 === v ? e.vertex_1 : e.vertex_0) as V;
    }

    protected _Edge_get_VertexDiskLoop(e: Edge, v: Vertex) {
        return e.vertex_0 === v ? e.vertex_disk_loop_0 : e.vertex_disk_loop_1;
    }

    protected _Edge_get_VertexNextEdge(e: Edge, v: Vertex) {
        return v == e.vertex_0 ? e.vertex_disk_loop_0.next_edge : e.vertex_disk_loop_1.next_edge;
    }

    protected _Edge_add_Loop(e: Edge, l: Loop) {
        if (e.loop === undefined) {
            // a new loop
            e.loop = l;
        }
        else {
            l.radial_prev_loop = e.loop;
            l.radial_next_loop = e.loop.radial_next_loop;

            e.loop.radial_next_loop.radial_prev_loop = l;
            e.loop.radial_next_loop = l;

            e.loop = l;
        }
    }

    protected _Edge_delete_Loop(e: Edge, l: Loop) {
        if (l.radial_next_loop !== l) {
            if (l == e.loop) {
                e.loop = l.radial_next_loop;
            }
            l.radial_next_loop.radial_prev_loop = l.radial_prev_loop;
            l.radial_prev_loop.radial_next_loop = l.radial_next_loop;
            l.radial_next_loop = l.radial_prev_loop = l;
        }
        else {
            // only loop
            if (l == e.loop) {
                e.loop = undefined;
            }
            else {
                throw new Error("<Shape> _Edge_delete_Loop: should not reach");
            }
        }
    }

    // #endregion

    // #region Loop

    public has_Loop(l: L) {
        return this.loops.has(l);
    }

    public check_LoopCreation(v: V, es: E[]): boolean {
        const edge_count = es.length;

        if (edge_count <= 0) return false;

        // for input:
        // vert v0
        // egde [v0-v1, v1-v2, v2-v3, .... vn_1-vn] or
        // edge [v1-v0, v2-v1, v2-v3, .... vn-vn_1] ....
        // where the loop:
        // started at v0
        // then v0 - e0 - v1 - e1 - v2 - e2 - .... - vn - en - vn+1
        // and
        // vn+1 is v0

        // special case only one vert and edge 
        // v0 ----------+
        //  |           |
        //  +--- e0 --- v0

        if (edge_count === 1) {
            const edge = es[0];
            return edge.vertex_0 === v && edge.vertex_1 === v;
        }

        // v0 --- e0 --- v1 --- e1 --- v2 --- e2 --- .... --- vn --- en ---+
        //  |                                                              |
        //  +--------------------------------------------------------------+

        let v0 = v;
        const visited_vertices: WeakSet<Vertex> = new WeakSet();
        for (let i = 0; i < edge_count; i++) {
            const e = es[i];
            if (!this._Edge_has_Vertex(e, v0)) return false;
            v0 = this._Edge_get_OppositeVertex(e, v0);
            if (visited_vertices.has(v0)) return false;
            visited_vertices.add(v0);
        }

        if (v0 !== v) return false;

        return true;
    }

    /**
     * this will assume vertices and edges are the same length and not empty
     */
    protected create_Loop(v: V, es: E[], f: F): L {
        const edge_count = es.length;

        let v0 = v;
        const e0 = es[0];
        const loop = new this.loop_constructor(v, es[0], f);
        this._Edge_add_Loop(e0, loop);
        let last_loop = loop;
        for (let i = 1; i < edge_count; i++) {
            const e = es[i];
            v0 = this._Edge_get_OppositeVertex(e, v0);
            const l = new this.loop_constructor(v0, e, f);
            this._Edge_add_Loop(e, l);
            this._Loop_LinkNext(last_loop, l);
            last_loop = l;
        }

        return loop;
    }

    protected _Loop_LinkNext(l0: L, l1: L) {
        if (l1 !== l0) {
            if (l0.next_loop === l0) {
                // single loop
                l1.next_loop = l0;
                l1.prev_loop = l0;
                l0.next_loop = l1;
                l0.prev_loop = l1;
            }
            else {
                // into loop disk
                l1.prev_loop = l0;
                l1.next_loop = l0.next_loop;
                l0.next_loop.prev_loop = l1;
                l0.next_loop = l1;
            }
        }
    }

    protected _Loop_Unlink(l: L) {
        if (l.next_loop === l) return;
        l.next_loop.prev_loop = l.prev_loop;
        l.prev_loop.next_loop = l.next_loop;
        l.next_loop = l.prev_loop = l;
    }

    // #endregion

    // #region Face

    public has_Face(f: F) {
        return this.faces.has(f);
    }

    public create_Face(v: V, es: E[]): Result<F, Error> {
        if (!this.check_LoopCreation(v, es)) return Result.Error(new Error('<Shape> create_Face: vertex or edges are not valid'));

        const face = new this.face_constructor();
        this.faces.add(face);

        const loop = this.create_Loop(v, es, face);
        face.boundary_loop = loop;

        return Result.Ok(face);
    }

    public reverse_Face(f: F) {

        // from: + ~-------A----------+
        //       |         ^          ~
        //       |    +----------+    |
        //       |    |          |    |
        //       D    |    Fa    |    |
        //       |    |    ce    |    B
        //       |    |          |    |
        //       |    +----------+    |
        //       ~                    |
        //       +---------C--------~ +
        // 
        //   to: ~ +-------D----------~
        //       |         ^          +
        //       |    +----------+    |
        //       |    |          |    |
        //       C    |    Fa    |    |
        //       |    |    ce    |    A
        //       |    |          |    |
        //       |    +----------+    |
        //       +                    |
        //       ~--------B---------+ ~

        const loop = f.boundary_loop;
        let e_prev = loop.prev_loop.edge;
        let l_prev_radial_next = loop.prev_loop.radial_next_loop;
        let l_prev_radial_prev = loop.prev_loop.radial_prev_loop;
        let is_prev_boundary = l_prev_radial_next == l_prev_radial_next.radial_next_loop;
        let l_iter = loop;
        do {
            if (l_iter === undefined) break;
            const e_iter = l_iter.edge;
            const l_iter_radial_next = l_iter.radial_next_loop;
            const l_iter_radial_prev = l_iter.radial_prev_loop;
            const is_iter_boundary = l_iter_radial_next == l_iter_radial_next.radial_next_loop;
            if (is_prev_boundary) {
                /* boundary */
                l_iter.radial_next_loop = l_iter;
                l_iter.radial_prev_loop = l_iter;
            }
            else {
                /* non-boundary, replace radial links */
                l_iter.radial_next_loop = l_prev_radial_next;
                l_iter.radial_prev_loop = l_prev_radial_prev;
                l_prev_radial_next.radial_prev_loop = l_iter;
                l_prev_radial_prev.radial_next_loop = l_iter;
            }

            if (e_iter.loop == l_iter) {
                e_iter.loop = l_iter.next_loop;
            }
            l_iter.edge = e_prev;

            const tmp = l_iter.next_loop;
            l_iter.next_loop = l_iter.prev_loop;
            l_iter.prev_loop = tmp;

            e_prev = e_iter;
            l_prev_radial_next = l_iter_radial_next;
            l_prev_radial_prev = l_iter_radial_prev;
            is_prev_boundary = is_iter_boundary;

        } while ((l_iter = l_iter.prev_loop) != loop);
    }

    public get_FaceVertices(f: F) {
        const vertices: Vertex[] = [];
        let l_iter = f.boundary_loop;
        do {
            if (l_iter === undefined) break;
            vertices.push(l_iter.vertex);
        }
        while ((l_iter = l_iter.next_loop) !== f.boundary_loop);
        return vertices;
    }

    public get_FaceVerticesCount(f: F) {
        let count = 0;
        let l_iter = f.boundary_loop;
        do {
            if (l_iter === undefined) break;
            count++;
        }
        while ((l_iter = l_iter.next_loop) !== f.boundary_loop);
        return count;
    }

    public get_FaceEdges(f: F) {
        const edges: Edge[] = [];
        let l_iter = f.boundary_loop;
        do {
            if (l_iter === undefined) break;
            edges.push(l_iter.edge);
        }
        while ((l_iter = l_iter.next_loop) !== f.boundary_loop);
        return edges as E[];
    }

    public get_FaceEdgesCount(f: F) {
        let count = 0;
        let l_iter = f.boundary_loop;
        do {
            if (l_iter === undefined) break;
            count++;
        }
        while ((l_iter = l_iter.next_loop) !== f.boundary_loop);
        return count;
    }

    // #endregion
}