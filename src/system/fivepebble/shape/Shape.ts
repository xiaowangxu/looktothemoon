import { Result } from "@/system/utils/Result";
import { Edge, type VertexDiskLoop } from "./Edge";
import { Face } from "./Face";
import { Loop } from "./Loop";
import { Vertex } from "./Vertex";

export class Shape {
    private readonly vertices: Set<Vertex> = new Set();
    private readonly edges: Set<Edge> = new Set();
    private readonly loops: Set<Loop> = new Set();
    private readonly faces: Set<Face> = new Set();
    private readonly vertex_constructor: new () => Vertex;
    private readonly edge_constructor: new (v0: Vertex, v1: Vertex) => Edge;
    private readonly loop_constructor: new (v: Vertex, e: Edge, f: Face) => Loop;
    private readonly face_constructor: new () => Face;

    constructor(
        vertex_constructor: new () => Vertex,
        edge_constructor: new (v0: Vertex, v1: Vertex) => Edge,
        loop_constructor: new (v: Vertex, e: Edge, f: Face) => Loop,
        face_constructor: new () => Face,
    ) {
        this.vertex_constructor = vertex_constructor;
        this.edge_constructor = edge_constructor;
        this.loop_constructor = loop_constructor;
        this.face_constructor = face_constructor;
    }

    // #region Vertex

    public has_Vertex(v: Vertex) {
        return this.vertices.has(v);
    }

    public create_Vertex() {
        const vertex = new this.vertex_constructor();
        this.vertices.add(vertex);
        return vertex;
    }

    public get_VertexEdgeCount(v: Vertex) {
        let count = 0;
        let e_iter = v.edge;
        do {
            if (e_iter === undefined) break;
            count++;
        }
        while ((e_iter = this._Edge_get_VertexNextEdge(e_iter, v)) !== v.edge);
        return count;
    }

    protected _Vertex_add_Edge(v: Vertex, e: Edge) {
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

    protected _Vertex_delete_Edge(v: Vertex, e: Edge) {
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

    public has_Edge(e: Edge) {
        return this.edges.has(e);
    }

    public create_Edge(v0: Vertex, v1: Vertex): Result<Edge, Error> {
        if (!this.has_Vertex(v0) || !this.has_Vertex(v1)) return Result.Error(new Error('<Shape> create_Edge: v0 or v1 are not valid'));
        if (v0 === v1) return Result.Error(new Error('<Shape> create_Edge: v0 and v1 are the same vertex'));
        const edge = new this.edge_constructor(v0, v1);
        this.edges.add(edge);
        this._Vertex_add_Edge(v0, edge);
        this._Vertex_add_Edge(v1, edge);
        return Result.Ok(edge);
    }

    protected _Edge_get_VertexDiskLoop(e: Edge, v: Vertex) {
        return e.vertex_0 === v ? e.vertex_disk_loop_0 : e.vertex_disk_loop_1;
    }

    protected _Edge_get_VertexNextEdge(e: Edge, v: Vertex) {
        return v == e.vertex_0 ? e.vertex_disk_loop_0.next_edge : e.vertex_disk_loop_1.next_edge;
    }

    // #endregion

    // #region Loop

    public has_Loop(l: Loop) {
        return this.loops.has(l);
    }

    // #endregion

    // #region Face

    public has_Face(f: Face) {
        return this.faces.has(f);
    }

    // #endregion
}

const shape = new Shape(Vertex, Edge, Loop, Face);
const v0 = shape.create_Vertex();
const v1 = shape.create_Vertex();
const e0 = shape.create_Edge(v0, v1);
const v2 = shape.create_Vertex();
const e1 = shape.create_Edge(v0, v2);
const v3 = shape.create_Vertex();
const e2 = shape.create_Edge(v0, v3);
console.log(shape.get_VertexEdgeCount(v1));
