/**
 * @param {FileSystemDataInstance[]} data
 * @returns {ArrayBuffer}
 */
export function save_FileSystem(data: FileSystemDataInstance[]): ArrayBuffer;
/**
 * @param {ArrayBuffer} data
 * @return {FileSystemDataInstance[] | undefined}
 */
export function load_FileSystem(data: ArrayBuffer): FileSystemDataInstance[] | undefined;
export type FileSystemDataInstance = {
    name: string | undefined;
    is_file: boolean;
    is_root: boolean;
    buffer: ArrayBuffer | undefined;
    subs: number[] | undefined;
};
