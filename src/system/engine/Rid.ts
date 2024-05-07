export type Rid = number;

let rid_counter = 1;

export function RID(): Rid {
    return rid_counter++;
}