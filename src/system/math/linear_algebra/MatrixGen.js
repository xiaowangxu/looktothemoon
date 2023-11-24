let rows = [];

const size = 4;

const ops = [
    ['clone', (id) => `this.elements[${id}]`],

    ['+', (id) => `this.elements[${id}] + b.elements[${id}]`],
    ['+ n', (id) => `this.elements[${id}] + b`],
    ['-', (id) => `this.elements[${id}] - b.elements[${id}]`],
    ['- n', (id) => `this.elements[${id}] - b`],
    ['*', (id) => `this.elements[${id}] * b.elements[${id}]`],
    ['* n', (id) => `this.elements[${id}] * b`],
    ['/', (id) => `this.elements[${id}] / b.elements[${id}]`],
    ['/ n', (id) => `this.elements[${id}] / b`],

    ['add scaled', (id) => `this.elements[${id}] + b.elements[${id}] * num`],
];

function op(name, f) {
    const rows = [];
    for (let i = 0; i < size; i++) {
        const ids = [];
        for (let j = 0; j < size; j++) {
            const id = i * size + j;
            ids.push(f(id));
        }
        rows.push(ids.join(', ') + ',');
    }
    console.log(name);
    console.log(rows.join('\n'));
    console.log('-----------------------------------------------------');
}

for (const [name, f] of ops) {
    op(name, f);
}

console.log('transpose');
rows = [];
for (let i = 0; i < size; i++) {
    const ids = [];
    for (let j = 0; j < size; j++) {
        const id = j * size + i;
        ids.push(`this.elements[${id}]`);
    }
    rows.push(ids.join(', ') + ',');
}
console.log(rows.join('\n'));
console.log('-----------------------------------------------------');

console.log('compose');
rows = [];
for (let i = 0; i < size; i++) {
    const row = []
    for (let j = 0; j < size; j++) {
        const mults = [];
        for (let x = 0; x < size; x++) {
            const b = `b${i + 1}${x + 1}`;
            const n = `n${x + 1}${j + 1}`;
            mults.push(`${b} * ${n}`);
        }
        row.push(mults.join(' + '));
    }
    rows.push(`${row.join(', ')},`);
}

console.log(rows.join('\n'));
