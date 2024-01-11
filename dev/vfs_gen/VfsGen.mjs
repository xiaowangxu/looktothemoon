#!/usr/bin/node

import { readdirSync, lstatSync, readFileSync, writeFileSync } from 'fs';
import { save_FileSystem } from '../../src/system/filesystem/fs_saver_loader/FileSystemSaverLoader.mjs';
import { extname, basename, parse, resolve } from 'path';
import chalk from 'chalk';

const [, , base_path, out_path] = process.argv;

function get_MemorySize(byte_length) {
    const size = byte_length / 1024 / 1024;
    return `${(size < 1 ? size * 1024 : size).toFixed(4)} ${size < 1 ? 'KB' : 'MB'}`;
}

console.log(`${chalk.bold.greenBright('[ building vfs data ]')}\n`);

/**
 * @typedef {import('../../src/system/filesystem/fs_saver_loader/FileSystemSaverLoader.mjs').FileSystemDataInstance} FileSystemDataInstance
 */

/**
 * @type {FileSystemDataInstance[]}
 */
const nodes = [];

function get_FileBuffer(path) {
    const ext = extname(path).toLowerCase();
    const is_text = ['.txt', '.json'].includes(ext);
    const is_lttm = ['.lttmbin'].includes(ext);
    const name = parse(path).name;
    const name_ext = extname(name);
    if (name_ext === '.ignore') return undefined;
    if (is_text) {
        const file = readFileSync(path, { encoding: 'utf8' });
        return new TextEncoder().encode(file).buffer;
    }
    else if (is_lttm) {
        const uint_array = readFileSync(path);
        return uint_array.buffer.slice(uint_array.byteOffset, uint_array.byteOffset + uint_array.byteLength)
    }
    return undefined;
}

let dirs_count = 0;
let files_count = 0;
function walk(path, root = false, header = '') {
    const dir = readdirSync(path);
    const subs = [];
    for (const d of dir) {
        const rel_path = `${path}/${d}`;
        const stat = lstatSync(rel_path);
        if (stat.isFile()) {
            const name = basename(rel_path);
            const idx = nodes.length;
            const buffer = get_FileBuffer(rel_path);
            console.log(`${`${header}> file : ${name} `.padEnd(60, '.')} ${buffer !== undefined ? chalk.greenBright(`loaded ${get_MemorySize(buffer.byteLength)}`) : chalk.red('ignored')}`);
            if (buffer === undefined) continue;
            nodes.push({
                name: name,
                is_file: true,
                is_root: root,
                buffer: buffer,
                subs: undefined,
            });
            subs.push(idx);
            files_count++;
        }
        else if (stat.isDirectory()) {
            console.log(chalk.grey(`${header}* dir  : ${d}`));
            const idx = nodes.length;
            nodes.push({
                name: d,
                is_file: false,
                is_root: root,
                buffer: undefined,
                subs: walk(rel_path, false, `    ${header}`),
            });
            subs.push(idx);
            dirs_count++;
        }
    }
    return subs;
}

console.log(`${chalk.bold.blueBright('[ build nodes ]')}\n`);
walk(base_path, true);
console.log(`\nloaded ${dirs_count} dir(s), ${files_count} file(s)`);

console.log(`${chalk.bold.blueBright('\n[ encoding data ]')}\n`);
const buffer = save_FileSystem(nodes);

console.log(`${chalk.bold.blueBright(`[ write to ${out_path} file ]`)}\n`);
writeFileSync(out_path, new Uint8Array(buffer));
console.log(`write to ${out_path} with ${get_MemorySize(buffer.byteLength)}\n`);

console.log(`${chalk.bold.greenBright('[ ok ]')}\n`);
