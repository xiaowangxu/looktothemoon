import '../SunDesignStyle.styl';
import { createApp, type App, markRaw } from "vue";
import { calcMenuPopupRect, type BoxSize, type Position, type PreferedDirection, type Rect, type UID } from "../SunDesignConstants";
import type { MenuItem } from "../menupopup/SunMenuPopup.vue";
import SunMenuPopup from "../menupopup/SunMenuPopup.vue";
import { SignalEmitter } from "@/system/utils/SignalEmitter";

type ContextMenuItem<T extends UID = UID> = MenuItem<T>;

export default class SunContextMenu<T extends UID = UID> {
    private readonly root: HTMLDivElement = document.createElement('div');
    private readonly vue: App;
    private readonly rect: Rect;
    private readonly offset: BoxSize | undefined;

    public readonly signal_click: SignalEmitter<(data: T, has_sub_menu: boolean, evt: Event) => void> = new SignalEmitter();
    public readonly signal_click_outside: SignalEmitter<(evt: Event) => void> = new SignalEmitter();

    constructor(options: ContextMenuItem<T>[][], event: MouseEvent, offset?: BoxSize)
    constructor(options: ContextMenuItem<T>[][], position: Position, offset?: BoxSize)
    constructor(options: ContextMenuItem<T>[][], evt: MouseEvent | Position, offset?: BoxSize) {
        this.offset = offset !== undefined ? { ...offset } : { width: 0, height: 0 };
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        if (evt instanceof MouseEvent) {
            this.rect = { x: evt.clientX, y: evt.clientY, width: 0, height: 0 };
        }
        else {
            this.rect = { ...evt, width: 0, height: 0 };
        }
        document.body.appendChild(this.root);
        this.vue = createApp(SunMenuPopup, {
            options: options,
            getPopupRect: this.getPopupRect.bind(this),
            onClick: this.onClick.bind(this),
            onClickOutside: this.onClickOutside.bind(this),
        });
        this.vue.mount(this.root);
    }

    private getPopupRect(contentMinSize: BoxSize, preferedDirection: PreferedDirection, windowSize: BoxSize): { rect: Rect, direction?: PreferedDirection } {
        return calcMenuPopupRect(contentMinSize, this.rect, windowSize, preferedDirection, this.offset);
    }

    private onClick(data: any, hasSubMenu: boolean, evt: Event) {
        this.signal_click.trigger(data, hasSubMenu, evt);
        this.close();
    }

    private onClickOutside(evt: Event) {
        this.signal_click_outside.trigger(evt);
        this.close();
    }

    public close() {
        this.vue.unmount();
        document.body.removeChild(this.root);
        this.signal_click.clear();
        this.signal_click_outside.clear();
    }
}

export const ClipboardItems: ContextMenuItem<string>[] = markRaw([
    { label: '剪切', uid: 'copy', icon: 'Scissors', shortcut: 'Ctrl X' },
    { label: '复制', uid: 'cut', icon: 'Copy', shortcut: 'Ctrl C' },
    { label: '粘贴', uid: 'paste', icon: 'Clipboard', shortcut: 'Ctrl V' },
]);

export const SelectInputItems: ContextMenuItem<string>[] = markRaw([
    { label: '全选', uid: 'select-all', icon: 'TextCursorInput', shortcut: 'Ctrl A' },
]);

export class SunContextMenuEvent extends Event {
    private readonly options: ContextMenuItem[][] = [];
    private readonly callbacks: ((data: any, has_sub_menu: boolean, evr: Event) => void)[] = [];
    private readonly source: MouseEvent;
    private _defaultPrevented: boolean = false;

    public get defaultPrevented() { return this._defaultPrevented; }

    constructor(evt: MouseEvent) {
        super('ContextMenuEvent')
        this.source = evt;
    }

    public addOptions(options: ContextMenuItem[], callback?: (data: any, has_sub_menu: boolean, evr: Event) => void) {
        this.options.push(options);
        if (callback !== undefined) {
            this.callbacks.push(callback);
        }
    }

    public open() {
        this.preventDefault();
        const ctx_menu = new SunContextMenu(this.options, this.source);
        for (const callback of this.callbacks) {
            ctx_menu.signal_click.connect(callback);
        }
    }

    public preventDefault(): void {
        this.source.preventDefault();
        super.preventDefault();
        this._defaultPrevented = true;
    }
}