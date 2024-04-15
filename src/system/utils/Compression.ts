export async function compress(buffer: ArrayBufferLike) {
    const ds = new CompressionStream("gzip");
    const stream = new Blob([buffer]).stream().pipeThrough(ds);
    return await new Response(stream).arrayBuffer();
}

export async function decompress(buffer: ArrayBufferLike) {
    const ds = new DecompressionStream("gzip");
    const stream = new Blob([buffer]).stream().pipeThrough(ds);
    return await new Response(stream).arrayBuffer();
}