export type RID = number;

let rid_counter = 0;

export function Rid(): RID {
    return rid_counter++;
}