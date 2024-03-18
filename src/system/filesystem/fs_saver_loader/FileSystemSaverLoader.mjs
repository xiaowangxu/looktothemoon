// tsc src/system/filesystem/fs_saver_loader/FileSystemSaverLoader.js --declaration --allowJs --emitDeclarationOnly

/**
 * @typedef {Object} FileSystemDataInstance
 * @property {string | undefined} name
 * @property {boolean} is_file
 * @property {boolean} is_root
 * @property {number | undefined} buffer
 * @property {number[] | undefined} subs
 */

const Version0 = 0;
const Version1 = 0;
const Version2 = 1;

/**
 * @param {FileSystemDataInstance[]} data 
 * @param {ArrayBuffer[]} blocks 
 * @returns {ArrayBuffer}
 */
export function save_FileSystem(nodes, blocks) {
    const size = calcu_Size(nodes, blocks);
    const array_buffer = new ArrayBuffer(size);
    const uint_array = new Uint8Array(array_buffer);
    const data_view = new DataView(array_buffer);

    const little_endian = false;
    let pnt = 0;

    //#region header
    // LTTM VFS
    uint_array.set([76, 84, 84, 77, 32, 86, 70, 83], pnt); pnt += 8;
    // flags
    const flags = little_endian ? 1 : 0;
    data_view.setUint8(pnt, flags); pnt += 1;
    // version * 3
    data_view.setUint32(pnt, Version0, little_endian); pnt += 4;
    data_view.setUint32(pnt, Version1, little_endian); pnt += 4;
    data_view.setUint32(pnt, Version2, little_endian); pnt += 4;
    // skip hash 16
    pnt += 16;
    // date
    data_view.setBigUint64(pnt, BigInt(Date.now()), little_endian); pnt += 8;
    //#endregion

    //#region body

    const nodes_count = nodes.length;
    data_view.setUint32(pnt, nodes_count, little_endian); pnt += 4;
    for (let i = 0; i < nodes_count; i++) {
        // is_file | is_root
        const { name, is_file, is_root, subs, buffer } = nodes[i];
        const type = ((is_file ? 1 : 0) << 1) | (is_root ? 1 : 0);
        data_view.setUint8(pnt, type); pnt += 1;
        // flags
        pnt += 2;
        // name length
        if (name === undefined) {
            data_view.setUint32(pnt, 0, little_endian); pnt += 4;
        }
        else {
            const str = new TextEncoder().encode(name);
            const name_length = str.byteLength;
            data_view.setUint32(pnt, name_length, little_endian); pnt += 4;
            uint_array.set(str, pnt); pnt += name_length;
        }
        // dir
        if (!is_file) {
            if (subs === undefined) {
                data_view.setUint32(pnt, 0, little_endian); pnt += 4;
            }
            else {
                data_view.setUint32(pnt, subs.length, little_endian); pnt += 4;
                for (const sub of subs) {
                    data_view.setUint32(pnt, sub, little_endian); pnt += 4;
                }
            }
        }
        // file
        else {
            if (buffer === undefined) {
                data_view.setUint32(pnt, 0, little_endian); pnt += 4;
            }
            else {
                const block_id = buffer;
                data_view.setUint32(pnt, block_id + 1, little_endian); pnt += 4;
            }
        }
    }

    const buffers_count = blocks.length;
    data_view.setUint32(pnt, buffers_count, little_endian); pnt += 4;
    for (let i = 0; i < buffers_count; i++) {
        const buffer = blocks[i];
        const buffer_length = buffer.byteLength;
        data_view.setUint32(pnt, buffer_length, little_endian); pnt += 4;
        uint_array.set(new Uint8Array(buffer), pnt); pnt += buffer_length;
    }

    //#endregion

    return array_buffer;
}

/**
 * @param {FileSystemDataInstance[]} nodes 
 * @param {ArrayBuffer[]} blocks 
 * @returns {number}
 */
function calcu_Size(nodes, blocks) {
    let size = 0;
    // LTTM VFS
    size += 8;
    // flags
    size += 1;
    // version
    size += 4 * 3;
    // hash skiped
    size += 16;
    // date
    size += 8;
    // nodes count
    size += 4;
    // buffers count
    size += 4;
    for (const { name, is_file, subs } of nodes) {
        // type | root
        size += 1;
        // flags
        size += 2;
        // name length
        size += 4;
        if (name !== undefined) {
            const name_size = (new TextEncoder().encode(name)).buffer.byteLength;
            size += name_size;
        }
        // dir
        if (!is_file) {
            // subs count
            size += 4;
            if (subs !== undefined) {
                // each sub id
                size += subs.length * 4;
            }
        }
        // file
        else {
            // block id 0 - for no block / block id + 1 for a block index
            size += 4;
        }
    }
    for (const block of blocks) {
        // buffer size
        size += 4;
        // buffer data
        size += block.byteLength;
    }
    return size;
}

/**
 * @typedef {Object}  FileSystemData
 * @property {FileSystemDataInstance[]} nodes
 * @property {ArrayBuffer[]} blocks
 */

/**
 * @param {ArrayBuffer} data 
 * @return {FileSystemData | undefined}
 */
export function load_FileSystem(data) {
    let pnt = 0;
    const array_buffer = data;
    const uint_array = new Uint8Array(array_buffer);
    const data_view = new DataView(array_buffer);
    // LTTM VFS
    // header
    const header0 = data_view.getUint8(pnt); pnt += 1;
    const header1 = data_view.getUint8(pnt); pnt += 1;
    const header2 = data_view.getUint8(pnt); pnt += 1;
    const header3 = data_view.getUint8(pnt); pnt += 1;
    const header4 = data_view.getUint8(pnt); pnt += 1;
    const header5 = data_view.getUint8(pnt); pnt += 1;
    const header6 = data_view.getUint8(pnt); pnt += 1;
    const header7 = data_view.getUint8(pnt); pnt += 1;
    if (header0 !== 76 || header1 !== 84 || header2 !== 84 || header3 !== 77 ||
        header4 !== 32 || header5 !== 86 || header6 !== 70 || header7 !== 83) return undefined;
    const flags = data_view.getUint8(pnt); pnt += 1;
    // set little_endian
    const little_endian = (flags & 0x1) > 0;
    const version_0 = data_view.getUint32(pnt, little_endian); pnt += 4;
    const version_1 = data_view.getUint32(pnt, little_endian); pnt += 4;
    const version_2 = data_view.getUint32(pnt, little_endian); pnt += 4;
    // skip hash 16B
    pnt += 16;
    // date
    const date = data_view.getBigUint64(pnt, little_endian); pnt += 8;

    // nodes count
    /**
     * @type {FileSystemDataInstance[]}
     */
    const nodes = [];
    const nodes_count = data_view.getUint32(pnt, little_endian); pnt += 4;
    for (let i = 0; i < nodes_count; i++) {
        // type
        const type = data_view.getUint8(pnt); pnt += 1;
        const is_file = (type >>> 1) !== 0;
        const is_root = (type & 0b1) !== 0;
        // flags
        pnt += 2;
        // name
        const name_length = data_view.getUint32(pnt, little_endian); pnt += 4;
        let name = undefined;
        if (name_length > 0) {
            const _name = uint_array.subarray(pnt, pnt + name_length); pnt += name_length;
            name = new TextDecoder().decode(_name);
        }
        // dir
        if (!is_file) {
            // subs count
            const subs_count = data_view.getUint32(pnt, little_endian); pnt += 4;
            const subs = []
            for (let j = 0; j < subs_count; j++) {
                const sub = data_view.getUint32(pnt, little_endian); pnt += 4;
                subs.push(sub);
            }
            nodes.push({
                is_file: false,
                is_root: is_root,
                name: name,
                subs: subs,
                buffer: undefined,
            });
        }
        // file
        else {
            // block_id
            const block_id = data_view.getUint32(pnt, little_endian); pnt += 4;
            nodes.push({
                is_file: true,
                is_root: is_root,
                name: name,
                subs: undefined,
                buffer: block_id === 0 ? undefined : block_id - 1,
            });
        }
    }

    const buffers = [];
    const buffers_count = data_view.getUint32(pnt, little_endian); pnt += 4;
    for (let i = 0; i < buffers_count; i++) {
        const buffer_length = data_view.getUint32(pnt, little_endian); pnt += 4;
        const buffer = array_buffer.slice(pnt, pnt + buffer_length); pnt += buffer_length;
        buffers.push(buffer);
    }

    return { nodes, blocks: buffers };
}