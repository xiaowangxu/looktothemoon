import { createApp, type App, markRaw } from "vue";
import { calcMenuPopupRect, type BoxSize, type Position, type PreferedDirection, type Rect, type UID } from "../SunDesignConstants";
import type { MenuItem } from "../menupopup/SunMenuPopup.vue";
import SunMenuPopup from "../menupopup/SunMenuPopup.vue";
import '../SunDesignStyle.styl';

type ContextMenuItem<T extends UID = UID> = MenuItem<T>;

type ContextMenuResult = { data: any, has_sub_menu: boolean, evt: Event };

export default class SunContextMenu<T extends UID = UID> {
    private readonly root: HTMLDivElement = document.createElement('div');
    private readonly vue: App;
    private readonly rect: Rect;
    private readonly offset: BoxSize | undefined;
    private promise: Promise<any>;
    private resolve!: (value: ContextMenuResult) => void;
    private reject!: (reason: Event) => void;

    public get await(): PromiseLike<any> {
        return {
            then: (on_resolve, on_reject) => {
                this.promise = this.promise.then(on_resolve, on_reject);
                return this.await;
            }
        };
    };

    static #consume_catch: (reason: Event) => Promise<void> = (evt) => {
        console.log(evt);
        return Promise.resolve();
    };

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
        document.body.classList.add('__sun-design__', 'color-def');
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
        this.promise.finally(() => {
            this.close();
        });
        this.resolve({ data, has_sub_menu: hasSubMenu, evt });
    }

    private onClickOutside(evt: Event) {
        this.promise.catch(SunContextMenu.#consume_catch).finally(() => {
            this.close();
        });
        this.reject(evt);
    }

    public close() {
        this.vue.unmount();
        document.body.removeChild(this.root);
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