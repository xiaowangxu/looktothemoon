/**
 * create a bitmask
 * 
 * base is clamped to [0-31]
 * length is clamped to [0-32]
 * 
 * if base == 0,
 *      length == 0 , return 0x00000000
 *      length == 32, return 0xffffffff
 * 
 * for other combinmation
 *      return 
 *             
 *             0b 00001111 1111111 0 00000000 00000000
 *                    +- length -+ +----- base ------+
 * 
 * @param length length of 1s
 * @param base begin of 1s
 * @returns 
 */
export function bitmask(length: number = 32, base: number = 0) {
    base = Math.min(31, Math.max(0, base));
    length = Math.min(32 - base, Math.max(0, length));
    if (length === 0) return 0x00000000;
    if (length === 32) return 0xffffffff;
    const left = 32 - length;
    return ((0xffffffff << left) >>> left) << base;
}

/**
 * set one of the bitmask's 32 channel
 * 
 * from 
 *  
 *            0b 00001111 1111111 0 00000000 00000000
 * 
 * to
 *   
 *            0b 00001111 1111111 0 00000100 00000000
 *                                       + channel 10
 * 
 * @param bm origin bitmask
 * @param channel [0-31]
 * @returns 
 */
export function bitmask_enable(bm: number, channel: number) {
    return bm | (1 << channel | 0);
}

/**
 * keep bitmask to appear in a range [base, base + length]
 * 
 * from 
 *  
 *            0b 00001111 1111111 0 00010011 00110010
 * 
 * to
 *   
 *            0b 00000000 0011111 0 00010010 00000000
 *                          +--- range ---+
 * 
 * @param bm origin bitmask
 * @param length
 * @param base
 * @returns 
 */
export function bitmask_keep(bm: number, length: number, base: number) {
    return bm & bitmask(length, base);
}

/**
 * keep bitmask to appear in a range [base, base + length]
 * 
 * from 
 *  
 *            0b 00001111 1111111 0 00010011 00110010
 * 
 * to
 *   
 *            0b 00001111 1100000 0 00000001 00110010
 *                          +--- range ---+
 * 
 * @param bm origin bitmask
 * @param length
 * @param base
 * @returns 
 */
export function bitmask_clear(bm: number, length: number, base: number) {
    return bm & (~(bitmask(length, base)));
}

/**
 * enable value in a range [base, base + length] to a number literial, overflow bits will be ignored
 * 
 * from 
 *  
 *            0b 00000000 00000000 00000000 00000000
 * 
 * to
 * 
 *            0b 00000000 00101000 00000000 00000000
 *                          +++ value = 5, base = 19, length = 3
 * 
 * @param bm origin bitmask
 * @param value
 * @param base
 * @param length
 * @returns 
 */
export function bitmask_set(bm: number, value: number, base: number = 0, length: number = 32) {
    const v = value | 0;
    const mask = bitmask(length, base);
    return (bm & ~mask) | ((v << base) & mask);
}

/**
 * check if a channel is enable
 * 
 * @param bm origin bitmask
 * @param channel [0-31]
 * @returns 
 */
export function bitmask_check(bm: number, channel: number) {
    return (bm & (1 << channel | 0)) !== 0;
}

/**
 * check if ***one*** of a set of channels are enabled, 
 * 
 * @param bm origin bitmask
 * @param mask another bitmask
 * @returns 
 */
export function bitmask_test(bm: number, mask: number) {
    return (bm & mask) !== 0;
}

/**
 * check if two bitmask are same 
 * 
 * @param bm origin bitmask
 * @param channel [0-31]
 * @returns 
 */
export function bitmask_equal(bm: number, mask: number) {
    return bm === (mask | 0);
}

/**
 * disable one of the bitmask's 32 channel
 * 
 * from 
 *  
 *            0b 00001111 1111111 0 00000100 00000000
 * 
 * to
 *   
 *            0b 00001111 1111111 0 00000000 00000000
 *                                       + channel 10
 * 
 * @param bm origin bitmask
 * @param channel [0-31]
 * @returns 
 */
export function bitmask_disable(bm: number, channel: number) {
    return bm & (~(1 << channel | 0));
}

/**
 * flip one of the bitmask's 32 channel
 * 
 * from 
 *  
 *            0b 00001111 1111111 0 00000100 00000000
 * 
 * to
 *   
 *            0b 00001111 1111111 0 00000000 00000000
 *                                       + channel 10
 * 
 * from 
 *  
 *            0b 00001111 1111111 0 00000000 00000000
 * 
 * to
 *   
 *            0b 00001111 1111111 0 00000100 00000000
 *                                       + channel 10
 * 
 * @param bm origin bitmask
 * @param channel [0-31]
 * @returns 
 */
export function bitmask_toggle(bm: number, channel: number) {
    return bm ^ (1 << channel | 0);
}

/**
 * bm1 | bm2
 * @param bm1 
 * @param bm2 
 * @returns 
 */
export function bitmask_or(bm1: number, bm2: number) {
    return bm1 | bm2;
}

/**
 * bm1 & bm2
 * @param bm1 
 * @param bm2 
 * @returns 
 */
export function bitmask_and(bm1: number, bm2: number) {
    return bm1 & bm2;
}

/**
 * ~bm
 * @param bm 
 * @returns 
 */
export function bitmask_not(bm: number) {
    return ~bm;
}

/**
 * bm1 & bm2
 * @param bm1 
 * @param bm2 
 * @returns 
 */
export function bitmask_xor(bm1: number, bm2: number) {
    return bm1 ^ bm2;
}