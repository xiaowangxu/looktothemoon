export type RID = string;

let counter = 0n;

export function Rid() {
    return (counter++).toString();
}
