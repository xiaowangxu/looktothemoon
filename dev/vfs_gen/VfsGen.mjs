#!/usr/bin/node

import { readdirSync, lstatSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const [, , base_path, out_path] = process.argv;

const nodes = [];

function walk(path) {
    const dir = readdirSync(path);
    const subs = [];
    for (const d of dir) {
        const rel_path = `${path}/${d}`;
        const stat = lstatSync(rel_path);
        if (stat.isFile()) {
            console.log("find file :", rel_path);
            const idx = nodes.length;
            nodes.push({
                path: rel_path,
                name: d,
                is_file: true,
                idx: idx,
                subs: [],
            });
            subs.push(idx);
        }
        else if (stat.isDirectory()) {
            console.log("find dir  :", rel_path);
            const idx = nodes.length;
            nodes.push({
                path: rel_path,
                name: d,
                is_file: false,
                idx: idx,
                subs: walk(rel_path),
            });
            subs.push(idx);
        }
    }
    return subs;
}

console.log("[ build nodes ]\n");
walk(base_path);

// console.log(nodes);

console.log("\n[ read file nodes ]\n");
for (const node of nodes) {
    if (node.is_file) {
        console.log("load file :", node.path);
        node.buffer = readFileSync(node.path);
        console.log("          : loaded");
    }
}

let size = 0;
size += 1; // L
size += 1; // T
size += 1; // T
size += 1; // M
size += 1; //  
size += 1; // V
size += 1; // F
size += 1; // S
size += 4; // node's count

const buffer = Buffer.alloc(size);
let ptr = 0;
// header
buffer.writeUint8('L'.charCodeAt(0), ptr); ptr += 1;
buffer.writeUint8('T'.charCodeAt(0), ptr); ptr += 1;
buffer.writeUint8('T'.charCodeAt(0), ptr); ptr += 1;
buffer.writeUint8('M'.charCodeAt(0), ptr); ptr += 1;
buffer.writeUint8(' '.charCodeAt(0), ptr); ptr += 1;
buffer.writeUint8('V'.charCodeAt(0), ptr); ptr += 1;
buffer.writeUint8('F'.charCodeAt(0), ptr); ptr += 1;
buffer.writeUint8('S'.charCodeAt(0), ptr); ptr += 1;
// nodes count
buffer.writeUInt32BE(nodes.length, ptr); ptr += 4;

console.log(`\n[ write to ${out_path} file ]\n`);
writeFileSync(out_path, buffer);

console.log(`[ OK ]\n`);