import type { Validated } from "@/system/utils/Type";
import { Range } from "./Range";

export enum KnotVectorValidation {
    Ok,
    /**
     * Invalid KnotVector Degree
     * degree should be &gt;= 1
     */
    DegreeLessThanOne,
    /**
     * Invalid KnotVector Degree
     * for KnotVector U={u(0), u(1), ..., u(m)}
     * 
     * |U| should be &gt;= order * 2
     */
    KnotsCountError,
    /**
     * Invalid KnotVector
     * for KnotVector U={u(0), u(1), ..., u(m)}
     * 
     * u(i) &lt;= u(i+1)
     * 
     * therefore U should be flat or increasing
     */
    NotNonDecreasing,
    DomainIsZero,
    EndKnotMultipicityInvalid,
    InternalKnotMultipicityInvalid,
}

export enum KnotVectorStyle {
    None = 0,
    ClampStart = 1 << 0,
    ClampEnd = 1 << 1,
    Clamp = ClampStart | ClampEnd,
    Bezier = 1 << 2,
    // not impl yet
    // Uniform = 1 << 3,
    // not impl yet
    // QuasiUniform = 1 << 4,
    // not impl yet
    // PiecewiseBezier = 1 << 5,
}

export class KnotVector implements Validated<KnotVectorValidation> {

    public readonly validation!: KnotVectorValidation;
    public get is_valid() { return this.validation === KnotVectorValidation.Ok };

    public readonly degree: number;
    public readonly vector: number[];
    public readonly style!: KnotVectorStyle;
    public readonly domain!: Range;
    public readonly knot_domain!: Range;

    public get count() { return this.vector.length; }
    public get control_count() { return this.vector.length - this.degree - 1; }
    public get order() { return this.degree + 1; }

    private get n() { return this.vector.length - this.degree - 2; }
    private get p() { return this.degree; }
    private get m() { return this.vector.length - 1; }
    private get min_knot_index() { return this.degree; }
    private get max_knot_index() { return this.vector.length - this.degree - 1; }

    constructor(degree: number, knots: Iterable<number>) {
        this.degree = degree;
        this.vector = [...knots];
        this.validation = KnotVectorValidation.Ok;
        if (this.degree < 1) this.validation = KnotVectorValidation.DegreeLessThanOne;
        else if (this.count < 2 * this.order) this.validation = KnotVectorValidation.KnotsCountError;
        else if (this.vector[this.min_knot_index] == this.vector[this.max_knot_index]) this.validation = KnotVectorValidation.DomainIsZero;
        else {
            // init knot multipicities
            let count = 1;
            let index = 0;
            let value = this.vector[0];
            let decreasing = true;
            for (let i = 1; i < this.count; i++) {
                const cnt = this.vector[i];
                // not decreasing
                if (value > cnt) {
                    decreasing = false;
                    break;
                }
                if (value == cnt) count++;
                if (value < cnt) {
                    // this.KnotMultipicityMap.Add(value, (count, index));
                    value = cnt;
                    count = 1;
                    index = i;
                }
            }

            if (!decreasing) {
                this.validation = KnotVectorValidation.NotNonDecreasing;
            }
            else {
                // this.KnotMultipicityMap.Add(value, (count, index));
                // // check multiplicities and style
                let style = KnotVectorStyle.None;
                // let unique_knot_count = this.KnotMultipicityMap.Keys.Count;
                // for (int i = 0; i < unique_knot_count; i++)
                // {
                //     if (i == 0 || i == unique_knot_count - 1) {
                //         if (this.KnotMultipicityMap.Values[i].Multipiclty > this.NurbsOrder) return KnotVectorValidation.EndKnotMultipicityInvalid;
                //         else if (this.KnotMultipicityMap.Values[i].Multipiclty == this.NurbsOrder) style |= (i == 0 ? KnotVectorStyle.ClampStart : KnotVectorStyle.ClampEnd);
                //     }
                //     else {
                //         if (this.KnotMultipicityMap.Values[i].Multipiclty > this.Degree) return KnotVectorValidation.InternalKnotMultipicityInvalid;
                //     }
                // }
                // // style bezier
                // if (this.Count == this.NurbsOrder * 2 && (style & KnotVectorStyle.Clamp) == KnotVectorStyle.Clamp) style |= KnotVectorStyle.Bezier;
                // is valid setup data
                this.style = style;
                this.knot_domain = new Range(this.vector[0], this.vector[this.vector.length - 1]);
                this.domain = new Range(this.vector[this.min_knot_index], this.vector[this.max_knot_index]);
            }
        }
    }
}