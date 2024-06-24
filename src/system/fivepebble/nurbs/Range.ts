import type { Cloneable, Copyable, Equality } from "@/system/utils/Type";

export class Range implements Cloneable<Range>, Copyable<Range>, Equality<Range> {
    public min: number;
    public max: number;
    public get size() { return this.max - this.min; }

    public is_inf() { return this.min === -Infinity || this.max === Infinity; }

    constructor(min: number, max: number) {
        if (min > max) {
            this.min = max;
            this.max = min;
        }
        else {
            this.min = min;
            this.max = max;
        }
    }

    public lerp(weight: number) {
        return (1 - weight) * this.min + weight * this.max;
    }

    public unlerp(value: number) {
        const size = this.size;
        if (size === 0) return 0;
        return (value - this.min) / size;
    }

    public contain(value: number, include_start: boolean = true, include_end: boolean = true) {
        return (include_start ? this.min <= value : this.min < value) && (include_end ? value <= this.max : value < this.max);
    }

    public contain_Range(portion: Range, include_start: boolean = true, include_end: boolean = true) {
        return (include_start ? this.min <= portion.min : this.min < portion.min) && (include_end ? portion.max <= this.max : portion.max < this.max);
    }

    public clamp(value: number) {
        return value < this.min ? this.min : (value > this.max ? this.max : value);
    }

    public clamp_Range(interval: Range, target: Range): Range {
        if (interval.min >= this.max) {
            target.min = this.max;
            target.max = this.max;
        }
        if (interval.max <= this.min) {
            target.min = this.min;
            target.max = this.min;
        }
        target.min = Math.max(interval.min, this.min);
        target.max = Math.min(interval.max, this.max);
        return target;
    }


    clone(): Range {
        return new Range(this.min, this.max);
    }
    copy(from: Range): Range {
        this.min = from.min;
        this.max = from.max;
        return this;
    }
    equal(other: Range): boolean {
        return this.min === other.min && this.max === other.max;
    }
}