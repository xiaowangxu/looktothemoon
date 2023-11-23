import { vec2, Vector2 } from "../math/linear_algebra/Vector2";
import { Ref } from "../utils/RefCounted";
import { FrameBuffer } from "./FrameBuffer";
import { RenderingDevice } from "./RenderingDevice";
import { Texture } from "./Texture";
import { Vector4, vec4 } from "../math/linear_algebra/Vector4";
import type { ShaderProgram } from "./Shader";
import { RenderGraph } from "./RenderGraph";
import type { RenderTexture } from "./RenderTexture";

export abstract class FramePassBase {
    public readonly name: string;
    protected readonly rd: RenderingDevice;
    protected readonly rg: RenderGraph;
    protected readonly size: Vector2 = vec2(8, 8);

    public abstract init(): void;
    public abstract use_Internal(enable_clear: boolean): void;
    public abstract use(): void;
    public abstract render(): void;
    public abstract end(): void;
    public abstract resize(width: number, height: number): void;
    public abstract dispose(): void;

    constructor(rg: RenderGraph, name: string) {
        this.rg = rg;
        this.rd = rg.rd;
        this.name = name;
    }
}

export class FramePass extends FramePassBase {

    protected readonly clear_color: Vector4 = vec4(0, 0, 0, 1);
    protected clear_mask: number | undefined = undefined;

    public readonly framebuffer: Ref<FrameBuffer> | undefined;
    private readonly attached_textures: Map<number, Ref<Texture>> = new Map();

    constructor(rg: RenderGraph, name: string, on_screen: boolean) {
        super(rg, name);
        this.framebuffer = on_screen ? undefined : new Ref(this.rd.state.create_FrameBuffer());
        if (this.framebuffer !== undefined) {
            this.rd.state.compile_FrameBuffer(this.framebuffer.value!);
        }
    }

    public create_Attachment(attachment: number,
        internal_format: number, format: number, type: number,
        min_filter: number, mag_filter: number,
        mipmap: boolean
    ) {
        if (this.framebuffer === undefined) throw new Error('can not create attachment on screen canvas frame buffer');
        const state = this.rd.state;
        const gl = state.gl;
        const texture = state.create_Texture([undefined], this.size.x, this.size.y, internal_format, format, type, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, min_filter, mag_filter, mipmap);
        if (this.attached_textures.has(attachment)) {
            this.attached_textures.get(attachment)!.value = texture;
        }
        else {
            this.attached_textures.set(attachment, new Ref(texture));
        }
    }

    public get_Attachment(attachment: number) {
        if (this.framebuffer === undefined) throw new Error('can not get attachment on screen canvas frame buffer');
        return this.attached_textures.get(attachment)?.value;
    }

    public attach() {
        if (this.framebuffer === undefined) throw new Error('can not attach on screen canvas frame buffer');
        const state = this.rd.state;
        const depth_attachment = state.gl.DEPTH_ATTACHMENT;
        const attachments = [];
        const framebuffer = this.framebuffer.value!;
        for (const [attach, texture_ref] of this.attached_textures) {
            state.set_FrameBufferTexture(framebuffer, attach, texture_ref.value!, 0);
            if (attach !== depth_attachment) {
                attachments.push(attach);
            }
        }
        state.enabled_FrameBufferAttachments(framebuffer, attachments);
    }

    public init() {
        if (this.clear_mask === undefined) {
            const state = this.rd.state;
            state.bind_FrameBuffer(undefined, this.framebuffer === undefined ? undefined : this.framebuffer.value!);
            state.set_Viewport(0, 0, this.size.x, this.size.y);
            const { r, g, b, a } = this.clear_color;
            state.clear_FrameBuffer(undefined, r, g, b, a);
        }
    }

    public use_Internal(enable_clear: boolean) {
        const state = this.rd.state;
        state.bind_FrameBuffer(undefined, this.framebuffer === undefined ? undefined : this.framebuffer.value!);
        const { r, g, b, a } = this.clear_color;
        state.set_Viewport(0, 0, this.size.x, this.size.y);
        if (enable_clear && this.clear_mask !== undefined) {
            state.clear_FrameBuffer(this.clear_mask, r, g, b, a);
        }
    }

    public use() {
        this.use_Internal(true);
    }

    public render() { }

    public end() { }

    public resize(width: number, height: number) {
        width = Math.ceil(width);
        height = Math.ceil(height);
        if (this.size.equal(vec2(width, height))) return;
        this.size.set(width, height);
        const state = this.rd.state;
        if (this.framebuffer === undefined) {
            this.rd.canvas.width = this.size.x;
            this.rd.canvas.height = this.size.y;
        }
        else {
            for (const texture_ref of this.attached_textures.values()) {
                const texture = texture_ref.value!;
                texture.width = this.size.x;
                texture.height = this.size.y;
                state.set_Texture(texture, 0, texture.internal_format, texture.format, texture.type, undefined, texture.width, texture.height, false);
                state.set_TextureParameters(texture, texture.wrap_s, texture.wrap_t, texture.min_filter, texture.mag_filter);
            }
        }
        this.init();
    }

    public set_ClearColor(r: number, g: number, b: number, a: number = 1) {
        this.clear_color.set(r, g, b, a);
    }

    public set_ClearMask(mask: number | undefined) {
        this.clear_mask = mask;
    }

    public dispose() {
        if (this.framebuffer !== undefined) {
            this.framebuffer.clear();
        }
        for (const texture of this.attached_textures.values()) {
            texture.clear();
        }
        this.attached_textures.clear();
    }
}

export class MultiSampleFramePass extends FramePassBase {
    protected readonly size: Vector2 = vec2(8, 8);

    protected readonly clear_color: Vector4 = vec4(0, 0, 0, 1);
    protected clear_mask: number | undefined = undefined;

    public readonly framebuffer_rendertexture: Ref<FrameBuffer> | undefined;
    public readonly framebuffer_texture: Ref<FrameBuffer> | undefined;

    private readonly attached_textures: Map<number, [Ref<RenderTexture>, Ref<Texture>]> = new Map();
    private attachments: number[]  = [];

    constructor(rg: RenderGraph, name: string, on_screen: boolean) {
        super(rg, name);
        if (on_screen) {
            this.framebuffer_rendertexture = undefined;
            this.framebuffer_texture = undefined;
        }
        else {
            this.framebuffer_rendertexture = new Ref(this.rd.state.create_FrameBuffer());
            this.rd.state.compile_FrameBuffer(this.framebuffer_rendertexture.value!);
            this.framebuffer_texture = new Ref(this.rd.state.create_FrameBuffer());
            this.rd.state.compile_FrameBuffer(this.framebuffer_texture.value!);
        }
    }

    public create_Attachment(attachment: number,
        internal_format: number, samples: number, format: number, type: number,
        min_filter: number, mag_filter: number,
        mipmap: boolean
    ) {
        if (this.framebuffer_rendertexture === undefined) throw new Error('can not create attachment on screen canvas frame buffer');
        const state = this.rd.state;
        const gl = state.gl;
        const { x: width, y: height } = this.size;
        const rendertexture = state.create_RenderTexture(internal_format, samples, width, height);
        const texture = state.create_Texture([undefined], width, height, internal_format, format, type, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, min_filter, mag_filter, mipmap);
        if (this.attached_textures.has(attachment)) {
            this.attached_textures.get(attachment)![0]!.value = rendertexture;
            this.attached_textures.get(attachment)![1]!.value = texture;
        }
        else {
            this.attached_textures.set(attachment, [new Ref(rendertexture), new Ref(texture)]);
        }
    }

    public get_Attachment(attachment: number) {
        if (this.framebuffer_rendertexture === undefined) throw new Error('can not get attachment on screen canvas frame buffer');
        return this.attached_textures.get(attachment)?.[1]?.value;
    }

    public attach() {
        if (this.framebuffer_rendertexture === undefined || this.framebuffer_texture === undefined) throw new Error('can not attach on screen canvas frame buffer');
        const state = this.rd.state;
        const depth_attachment = state.gl.DEPTH_ATTACHMENT;
        this.attachments = [];
        const framebuffer_rendertexture = this.framebuffer_rendertexture.value!;
        const framebuffer_texture = this.framebuffer_texture.value!;
        for (const [attach, [rendertexture_ref, texture_ref]] of this.attached_textures) {
            state.set_FrameBufferRenderTexture(framebuffer_rendertexture, attach, rendertexture_ref.value!);
            state.set_FrameBufferTexture(framebuffer_texture, attach, texture_ref.value!, 0);
            if (attach !== depth_attachment) {
                this.attachments.push(attach);
            }
        }
        state.enabled_FrameBufferAttachments(framebuffer_rendertexture, this.attachments);
        state.enabled_FrameBufferAttachments(framebuffer_texture, this.attachments);
    }

    public init() {
        if (this.clear_mask === undefined) {
            const state = this.rd.state;
            state.bind_FrameBuffer(undefined, this.framebuffer_rendertexture === undefined ? undefined : this.framebuffer_rendertexture.value!);
            state.set_Viewport(0, 0, this.size.x, this.size.y);
            const { r, g, b, a } = this.clear_color;
            state.clear_FrameBuffer(undefined, r, g, b, a);
        }
    }

    public use_Internal(enable_clear: boolean) {
        const state = this.rd.state;
        state.bind_FrameBuffer(undefined, this.framebuffer_rendertexture === undefined ? undefined : this.framebuffer_rendertexture.value!);
        const { r, g, b, a } = this.clear_color;
        state.set_Viewport(0, 0, this.size.x, this.size.y);
        if (enable_clear && this.clear_mask !== undefined) {
            state.clear_FrameBuffer(this.clear_mask, r, g, b, a);
        }
    }

    public use() {
        this.use_Internal(true);
    }

    public render() { }

    public end() {
        if (this.framebuffer_rendertexture === undefined || this.framebuffer_texture === undefined) return;
        const state = this.rd.state;
        const gl = state.gl;
        const { x: width, y: height } = this.size;
        const framebuffer_rendertexture = this.framebuffer_rendertexture.value!;
        const framebuffer_texture = this.framebuffer_texture.value!;
        state.blit_FrameBuffers(framebuffer_rendertexture, framebuffer_texture,
            0, 0, width, height,
            0, 0, width, height,
            gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT, gl.NEAREST
        );
    }

    public resize(width: number, height: number) {
        width = Math.ceil(width);
        height = Math.ceil(height);
        if (this.size.equal(vec2(width, height))) return;
        this.size.set(width, height);
        const state = this.rd.state;
        if (this.framebuffer_rendertexture === undefined) {
            this.rd.canvas.width = this.size.x;
            this.rd.canvas.height = this.size.y;
        }
        else {
            const { x: width, y: height } = this.size;
            for (const [rendertexture_ref, texture_ref] of this.attached_textures.values()) {
                const rendertexture = rendertexture_ref.value!;
                rendertexture.width = width;
                rendertexture.height = height;
                state.set_RenderTexture(rendertexture, rendertexture.internal_format, rendertexture.samples, rendertexture.width, rendertexture.height);
                const texture = texture_ref.value!;
                texture.width = width;
                texture.height = height;
                state.set_Texture(texture, 0, texture.internal_format, texture.format, texture.type, undefined, texture.width, texture.height, false);
                state.set_TextureParameters(texture, texture.wrap_s, texture.wrap_t, texture.min_filter, texture.mag_filter);
            }
        }
        this.init();
    }

    public set_ClearColor(r: number, g: number, b: number, a: number = 1) {
        this.clear_color.set(r, g, b, a);
    }

    public set_ClearMask(mask: number | undefined) {
        this.clear_mask = mask;
    }

    public dispose() {
        if (this.framebuffer_rendertexture !== undefined) {
            this.framebuffer_rendertexture.clear();
        }
        if (this.framebuffer_texture !== undefined) {
            this.framebuffer_texture.clear();
        }
        for (const [rendertexture, texture] of this.attached_textures.values()) {
            rendertexture.clear();
            texture.clear();
        }
        this.attached_textures.clear();
    }
}

export class ProxyFramePass extends FramePassBase {
    private framepass: FramePass | MultiSampleFramePass | undefined = undefined;

    constructor(rg: RenderGraph, name: string, on_screen: boolean) {
        super(rg, name);
    }

    public set_Proxy(framepass: FramePass | MultiSampleFramePass | undefined) {
        this.framepass = framepass;
    }

    public get_Attachment(attachment: number) {
        if (this.framepass === undefined) throw new Error('can not get attachment on empty framepass');
        return this.framepass.get_Attachment(attachment);
    }

    public use_Internal(enable_clear: boolean) {
        if (this.framepass !== undefined) {
            this.framepass.use_Internal(false);
        }
    }

    public init(): void { }

    public use(): void {
        this.use_Internal(false);
    }

    public render(): void { }

    public end(): void { }

    public resize(width: number, height: number) { }

    public set_ClearColor(r: number, g: number, b: number, a: number = 1) { }

    public dispose(): void {
        this.framepass = undefined;
    }
}

export class FullScreenFramePass extends FramePass {
    private program: Ref<ShaderProgram> | undefined = undefined;

    constructor(rg: RenderGraph, name: string, on_screen: boolean) {
        super(rg, name, on_screen);
    }

    public set_Program(program: ShaderProgram | undefined) {
        if (this.program === undefined) {
            if (program === undefined) {
                this.program = undefined;
            }
            else {
                this.program = new Ref(program);
            }
        }
        else {
            if (program === undefined) {
                this.program.clear();
                this.program = undefined;
            }
            else {
                this.program.value = program;
            }
        }
        if (this.program !== undefined) {
            this.rd.state.compile_ShaderProgram(this.program.value!);
        }
    }

    public render() {
        if (this.program !== undefined) {
            this.rd.state.draw_VertexArray(this.program.value!, this.rd.state.create_FullScreenQuad());
        }
    }

    public dispose() {
        if (this.program !== undefined) {
            this.program.clear();
        }
        super.dispose();
    }
}

export class TestFramePass extends FramePass {

    private render_func: (() => void) | undefined = undefined;

    constructor(rg: RenderGraph, name: string, on_screen: boolean) {
        super(rg, name, on_screen);
    }

    public set_RenderFunc(render_func: (() => void) | undefined) {
        this.render_func = render_func;
    }

    public render() {
        if (this.render_func !== undefined) {
            this.render_func();
        }
    }
}

export class TestMultiSampleFramePass extends MultiSampleFramePass {

    private render_func: (() => void) | undefined = undefined;

    constructor(rg: RenderGraph, name: string, on_screen: boolean) {
        super(rg, name, on_screen);
    }

    public set_RenderFunc(render_func: (() => void) | undefined) {
        this.render_func = render_func;
    }

    public render() {
        if (this.render_func !== undefined) {
            this.render_func();
        }
    }
}

export class TestProxyFramePass extends ProxyFramePass {

    private render_func: (() => void) | undefined = undefined;

    constructor(rg: RenderGraph, name: string, on_screen: boolean) {
        super(rg, name, on_screen);
    }

    public set_RenderFunc(render_func: (() => void) | undefined) {
        this.render_func = render_func;
    }

    public render() {
        if (this.render_func !== undefined) {
            this.render_func();
        }
    }
}