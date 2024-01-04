export type Rid = number;

let rid_counter = 0;

export function RID(): Rid {
    return rid_counter++;
}