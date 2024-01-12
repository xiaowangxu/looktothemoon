/**
 * @param {FileSystemDataInstance[]} data
 * @param {ArrayBuffer[]} blocks
 * @returns {ArrayBuffer}
 */
export function save_FileSystem(nodes: any, blocks: ArrayBuffer[]): ArrayBuffer;
/**
 * @typedef {Object}  FileSystemData
 * @property {FileSystemDataInstance[]} nodes
 * @property {ArrayBuffer[]} blocks
 */
/**
 * @param {ArrayBuffer} data
 * @return {FileSystemData | undefined}
 */
export function load_FileSystem(data: ArrayBuffer): FileSystemData | undefined;
export type FileSystemData = {
    nodes: FileSystemDataInstance[];
    blocks: ArrayBuffer[];
};
export type FileSystemDataInstance = {
    name: string | undefined;
    is_file: boolean;
    is_root: boolean;
    buffer: number | undefined;
    subs: number[] | undefined;
};
