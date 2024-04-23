export function bitmask(empty: boolean) {
    return empty ? 0x00000000 : 0xffffffff;
}

export function bitmask_enable(bitmask: number, channel: number) {
    return bitmask | (1 << channel | 0);
}

export function bitmask_check(bitmask: number, channel: number) {
    return (bitmask & (1 << channel | 0)) !== 0;
}

export function bitmask_test(bitmask: number, mask: number) {
    return (bitmask & mask) !== 0;
}

export function bitmask_disable(bitmask: number, channel: number) {
    return bitmask & (~(1 << channel | 0));
}

export function bitmask_toggle(bitmask: number, channel: number) {
    return bitmask ^ (1 << channel | 0);
}