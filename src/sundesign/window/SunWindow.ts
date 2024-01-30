import { createApp, type App, type Component } from "vue";
import { addWindow, focusWindow, removeWindow, useWindow, type WinId } from "./SunWindowConstants";
import './SunWindowStyle.styl';
import { type BoxSize, type Rect, DefualtWindowMargin } from "../SunDesignConstants";

const WindowTemplate = document.createElement('div');
WindowTemplate.innerHTML = `
<div class="__sun-design-window-cover__" tabindex="-1">
    <div class="__sun-design__ __sun-design-window-container__">
        <div id="window"></div>
        <div class="__sun-design-window-resize-r__" data-direction="right"></div>
        <div class="__sun-design-window-resize-l__" data-direction="left"></div>
        <div class="__sun-design-window-resize-t__" data-direction="top"></div>
        <div class="__sun-design-window-resize-b__" data-direction="bottom"></div>
        <div class="__sun-design-window-resize-tr__" data-direction="top-right"></div>
        <div class="__sun-design-window-resize-tl__" data-direction="top-left"></div>
        <div class="__sun-design-window-resize-br__" data-direction="bottom-right"></div>
        <div class="__sun-design-window-resize-bl__" data-direction="bottom-left"></div>
    </div>
</div>
`;

function remap(src_min: number, src_max: number, value: number, dst_min: number, dst_max: number) {
    const v = Math.min(1, Math.max(0, (value - src_min) / (src_max - src_min)));
    return dst_min + (dst_max - dst_min) * v;
}

export default class SunWindow {
    public readonly id: WinId;
    public readonly parent: WinId | undefined;

    private readonly vue: App;

    // #region dom

    private readonly window_cover: HTMLDivElement;
    private readonly window_container: HTMLDivElement;
    private readonly window_resize_r: HTMLDivElement;
    private readonly window_resize_l: HTMLDivElement;
    private readonly window_resize_t: HTMLDivElement;
    private readonly window_resize_b: HTMLDivElement;
    private readonly window_resize_tr: HTMLDivElement;
    private readonly window_resize_tl: HTMLDivElement;
    private readonly window_resize_br: HTMLDivElement;
    private readonly window_resize_bl: HTMLDivElement;

    // #endregion

    private popup_x: number = 100;
    private popup_y: number = 100;
    private popup_width: number = 300;
    private popup_height: number = 400;
    private popup_rect_attached: boolean = false;
    private popup_rect_attached_x: number = 0;
    private popup_rect_attached_y: number = 0;
    private popup_rect_attached_width: number = 1;
    private popup_rect_attached_height: number = 1;
    private get popup_rect(): Rect {
        const win_width = window.innerWidth - DefualtWindowMargin * 2;
        const win_height = window.innerHeight - DefualtWindowMargin * 2;
        return this.popup_rect_attached ? {
            x: DefualtWindowMargin + win_width * this.popup_rect_attached_x,
            y: DefualtWindowMargin + win_height * this.popup_rect_attached_y,
            width: win_width * this.popup_rect_attached_width,
            height: win_height * this.popup_rect_attached_height,
        } :
            { x: this.popup_x, y: this.popup_y, height: this.popup_height, width: this.popup_width };
    }

    private readonly on_drag_resize_down_right = (evt: MouseEvent) => this.onDragMouseDown('right', evt);
    private readonly on_drag_resize_down_left = (evt: MouseEvent) => this.onDragMouseDown('left', evt);
    private readonly on_drag_resize_down_top = (evt: MouseEvent) => this.onDragMouseDown('top', evt);
    private readonly on_drag_resize_down_bottom = (evt: MouseEvent) => this.onDragMouseDown('bottom', evt);
    private readonly on_drag_resize_down_top_right = (evt: MouseEvent) => this.onDragMouseDown('top-right', evt);
    private readonly on_drag_resize_down_top_left = (evt: MouseEvent) => this.onDragMouseDown('top-left', evt);
    private readonly on_drag_resize_down_bottom_right = (evt: MouseEvent) => this.onDragMouseDown('bottom-right', evt);
    private readonly on_drag_resize_down_bottom_left = (evt: MouseEvent) => this.onDragMouseDown('bottom-left', evt);

    private _visible: boolean = true;
    public get visible() { return this._visible; }
    public set visible(visible: boolean) {
        if (this._visible !== visible) {
            this._visible = visible;
            this.window_cover.style.display = this._visible ? 'block' : 'none';
        }
    }

    private _resizable: boolean = true;
    public get resizable() { return this._resizable; }
    public set resizable(resizable: boolean) {
        if (this._resizable !== resizable) {
            this._resizable = resizable;
            const display = this._resizable ? 'block' : 'none';
            this.window_resize_r.style.display = display;
            this.window_resize_l.style.display = display;
            this.window_resize_t.style.display = display;
            this.window_resize_b.style.display = display;
            this.window_resize_tr.style.display = display;
            this.window_resize_tl.style.display = display;
            this.window_resize_br.style.display = display;
            this.window_resize_bl.style.display = display;
        }
    }

    private _exclusive: boolean = false;
    public get exclusive() { return this._exclusive; }
    public set exclusive(exclusive: boolean) {
        if (this._exclusive !== exclusive) {
            this._exclusive = exclusive;
            if (this._exclusive) {
                this.window_cover.classList.add('stop-events');
            }
            else {
                this.window_cover.classList.remove('stop-events');
            }
        }
    }

    private _layer: number = -1;
    public get layer() { return this._layer; }
    public set layer(layer: number) {
        if (this._layer !== layer) {
            this._layer = layer;
            this.window_cover.style.zIndex = this._layer.toString();
        }
    }

    constructor(content: Component, data: Record<string, any> = {}, parent: WinId | undefined = undefined) {
        const root = useWindow();
        this.window_cover = WindowTemplate.querySelector('.__sun-design-window-cover__')!.cloneNode(true) as HTMLDivElement;
        root.appendChild(this.window_cover);
        this.window_container = this.window_cover.querySelector('.__sun-design-window-container__') as HTMLDivElement;
        this.window_resize_r = this.window_container.querySelector('.__sun-design-window-resize-r__') as HTMLDivElement;
        this.window_resize_l = this.window_container.querySelector('.__sun-design-window-resize-l__') as HTMLDivElement;
        this.window_resize_t = this.window_container.querySelector('.__sun-design-window-resize-t__') as HTMLDivElement;
        this.window_resize_b = this.window_container.querySelector('.__sun-design-window-resize-b__') as HTMLDivElement;
        this.window_resize_tr = this.window_container.querySelector('.__sun-design-window-resize-tr__') as HTMLDivElement;
        this.window_resize_tl = this.window_container.querySelector('.__sun-design-window-resize-tl__') as HTMLDivElement;
        this.window_resize_br = this.window_container.querySelector('.__sun-design-window-resize-br__') as HTMLDivElement;
        this.window_resize_bl = this.window_container.querySelector('.__sun-design-window-resize-bl__') as HTMLDivElement;
        this.window_resize_r.addEventListener('mousedown', this.on_drag_resize_down_right);
        this.window_resize_l.addEventListener('mousedown', this.on_drag_resize_down_left);
        this.window_resize_t.addEventListener('mousedown', this.on_drag_resize_down_top);
        this.window_resize_b.addEventListener('mousedown', this.on_drag_resize_down_bottom);
        this.window_resize_tr.addEventListener('mousedown', this.on_drag_resize_down_top_right);
        this.window_resize_tl.addEventListener('mousedown', this.on_drag_resize_down_top_left);
        this.window_resize_br.addEventListener('mousedown', this.on_drag_resize_down_bottom_right);
        this.window_resize_bl.addEventListener('mousedown', this.on_drag_resize_down_bottom_left);
        this.window_cover.addEventListener('focusin', this._focus);
        this.refreshRect();
        this.parent = parent;
        const { id, layer } = addWindow(this.parent, (layer) => this.layer = layer, this.on_doc_win_resized);
        this.id = id;
        this.layer = layer;
        this.vue = createApp(content, {
            ...data,
            onDrag: (evt: MouseEvent) => this.onDragMouseDown('drag', evt),
            onResize: (rect: Rect) => {
                this.popup_x = rect.x;
                this.popup_y = rect.y;
                this.popup_width = rect.width;
                this.popup_height = rect.height;
            },
            onShow: () => this.visible = true,
            onHide: () => this.visible = false,
            onMaximize: (toggle: boolean) => {
                if (this.dragging || !this.resizable) return;
                if (toggle) {
                    if (this.popup_rect_attached) this.unmaximize();
                    else this.maximize();
                }
                else {
                    this.maximize();
                }
            },
            onUnmaximize: () => {
                this.unmaximize();
            }
        });
        this.vue.mount(this.window_container.querySelector('#window'));
    }

    protected refreshRect() {
        const rect = this.popup_rect;
        this.window_container.style.left = `${rect.x}px`;
        this.window_container.style.top = `${rect.y}px`;
        this.window_container.style.width = `${rect.width}px`;
        this.window_container.style.height = `${rect.height}px`;
    }

    // #region resize / drag

    private dragging = false;
    private popup_last_x = 0;
    private popup_last_y = 0;
    private popup_last_width = 0;
    private popup_last_height = 0;
    private mouse_last_x = 0;
    private mouse_last_y = 0;
    private drag_type = 'none';

    private onDragMouseDown(type: string, evt: MouseEvent) {
        this.dragging = true;
        this.mouse_last_x = evt.clientX;
        this.mouse_last_y = evt.clientY;
        this.drag_type = type;
        if (this.drag_type === 'drag') {
            this.popup_last_width = this.popup_width;
            this.popup_last_height = this.popup_height;
            if (!this.popup_rect_attached) {
                this.popup_last_x = this.popup_x;
                this.popup_last_y = this.popup_y;
            }
            else {
                const rect = this.popup_rect;
                this.popup_last_x = this.mouse_last_x - remap(rect.x, rect.x + rect.width, this.mouse_last_x, 0, this.popup_width);
                this.popup_last_y = this.mouse_last_y - remap(rect.y, rect.y + rect.height, this.mouse_last_y, 0, this.popup_height);
            }
        }
        else {
            const rect = this.popup_rect;
            this.popup_x = this.popup_last_x = rect.x;
            this.popup_y = this.popup_last_y = rect.y;
            this.popup_width = this.popup_last_width = rect.width;
            this.popup_height = this.popup_last_height = rect.height;
        }
        window.addEventListener('mousemove', this._onDragMouseMove, { capture: true });
        window.addEventListener('mouseup', this._onDragMouseUp, { capture: true });
        this.focus();
    }
    private adjustLeft(mouse_delta_x: number, mouse_delta_y: number) {
        const width = Math.max(100, this.popup_last_width - mouse_delta_x);
        const right = this.popup_last_x + this.popup_last_width;
        this.popup_width = width;
        this.popup_x = right - width;
    }
    private adjustRight(mouse_delta_x: number, mouse_delta_y: number) {
        this.popup_width = Math.max(100, this.popup_last_width + mouse_delta_x);
    }
    private adjustTop(mouse_delta_x: number, mouse_delta_y: number) {
        const height = Math.max(100, this.popup_last_height - mouse_delta_y);
        const right = this.popup_last_y + this.popup_last_height;
        this.popup_height = height;
        this.popup_y = right - height;
    }
    private adjustBottom(mouse_delta_x: number, mouse_delta_y: number) {
        this.popup_height = Math.max(100, this.popup_last_height + mouse_delta_y);
    }
    private readonly _onDragMouseMove = this.onDragMouseMove.bind(this);
    private onDragMouseMove(evt: MouseEvent) {
        if (this.popup_rect_attached) {
            this.popup_rect_attached = false;
            this.popup_x = this.popup_last_x;
            this.popup_y = this.popup_last_y;
            this.popup_width = this.popup_last_width;
            this.popup_height = this.popup_last_height;
        }
        const mouse_delta_x = evt.clientX - this.mouse_last_x;
        const mouse_delta_y = evt.clientY - this.mouse_last_y;
        switch (this.drag_type) {
            case 'drag': {
                this.popup_x = this.popup_last_x + mouse_delta_x;
                this.popup_y = this.popup_last_y + mouse_delta_y;
                break;
            }
            case 'right': {
                this.adjustRight(mouse_delta_x, mouse_delta_y);
                break;
            }
            case 'left': {
                this.adjustLeft(mouse_delta_x, mouse_delta_y);
                break;
            }
            case 'bottom': {
                this.adjustBottom(mouse_delta_x, mouse_delta_y);
                break;
            }
            case 'top': {
                this.adjustTop(mouse_delta_x, mouse_delta_y);
                break;
            }
            case 'top-right': {
                this.adjustTop(mouse_delta_x, mouse_delta_y);
                this.adjustRight(mouse_delta_x, mouse_delta_y);
                break;
            }
            case 'bottom-right': {
                this.adjustBottom(mouse_delta_x, mouse_delta_y);
                this.adjustRight(mouse_delta_x, mouse_delta_y);
                break;
            }
            case 'top-left': {
                this.adjustTop(mouse_delta_x, mouse_delta_y);
                this.adjustLeft(mouse_delta_x, mouse_delta_y);
                break;
            }
            case 'bottom-left': {
                this.adjustBottom(mouse_delta_x, mouse_delta_y);
                this.adjustLeft(mouse_delta_x, mouse_delta_y);
                break;
            }
        }
        this.refreshRect();
    }
    private readonly _onDragMouseUp = this.onDragMouseUp.bind(this);
    private onDragMouseUp() {
        this.dragging = false;
        this.refreshRect();
        this.removeDraggingEvents();
    }
    private removeDraggingEvents() {
        window.removeEventListener('mousemove', this._onDragMouseMove, { capture: true });
        window.removeEventListener('mouseup', this._onDragMouseUp, { capture: true });
    }

    //#endregion

    private readonly on_doc_win_resized = (box_size: BoxSize) => {
        if (this.dragging || !this.popup_rect_attached) return;
        this.refreshRect();
    };

    private readonly _focus = this.focus.bind(this);
    private focus() {
        focusWindow(this.id);
    }

    public maximize() {
        if (!this.resizable) return;
        this.popup_rect_attached_x = 0;
        this.popup_rect_attached_y = 0;
        this.popup_rect_attached_width = 1;
        this.popup_rect_attached_height = 1;
        this.popup_rect_attached = true;
        this.refreshRect();
    }

    public unmaximize() {
        if (!this.resizable || !this.popup_rect_attached) return;
        this.popup_rect_attached = false;
        this.refreshRect();
    }

    public pin(rect: Rect) {
        this.popup_rect_attached = true;
        this.popup_rect_attached_x = rect.x;
        this.popup_rect_attached_y = rect.y;
        this.popup_rect_attached_width = rect.width;
        this.popup_rect_attached_height = rect.height;
        this.refreshRect();
    }

    public unpin() {
        if (!this.popup_rect_attached) return;
        this.popup_rect_attached = false;
        this.refreshRect();
    }

    private removeAllEventListeners() {
        this.removeDraggingEvents();
        this.window_resize_r.removeEventListener('mousedown', this.on_drag_resize_down_right);
        this.window_resize_l.removeEventListener('mousedown', this.on_drag_resize_down_left);
        this.window_resize_t.removeEventListener('mousedown', this.on_drag_resize_down_top);
        this.window_resize_b.removeEventListener('mousedown', this.on_drag_resize_down_bottom);
        this.window_resize_tr.removeEventListener('mousedown', this.on_drag_resize_down_top_right);
        this.window_resize_tl.removeEventListener('mousedown', this.on_drag_resize_down_top_left);
        this.window_resize_br.removeEventListener('mousedown', this.on_drag_resize_down_bottom_right);
        this.window_resize_bl.removeEventListener('mousedown', this.on_drag_resize_down_bottom_left);
        this.window_cover.removeEventListener('focusin', this._focus);
    }

    public close() {
        this.removeAllEventListeners();
        removeWindow(this.id);
        this.vue.unmount();
        this.window_cover.parentNode?.removeChild(this.window_cover);
    }
}