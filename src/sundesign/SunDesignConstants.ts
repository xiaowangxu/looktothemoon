import { type CSSProperties, readonly, markRaw } from 'vue';

export type Size = 'small' | 'normal' | 'large';

export type BorderMask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export type BasicTypes = string | number | boolean | bigint | symbol;

export type BoxSize = { width: number, height: number };

export type Position = { x: number, y: number };

export type Rect = Position & BoxSize;

export type PopupOpenMode = 'instance' | 'visibility';

export type UID = string | number | symbol;

export interface Item<T extends UID = UID> {
    uid: T,
    label?: string,
    colorScheme?: ColorScheme,
    icon?: string,
    title?: string,
    description?: string,
    shortcut?: string,
    active?: boolean,
    disabled?: boolean,
    sub?: boolean,
}

export interface ColorScheme extends CSSProperties {
    '--focus-color'?: string,
    '--border-color-normal'?: string,
    '--border-color-disabled'?: string,
    '--border-color-active-disabled'?: string,
    '--placeholder-color'?: string,
    '--placeholder-color-disabled'?: string,
    '--color-normal'?: string,
    '--color-hover'?: string,
    '--color-pressed'?: string,
    '--color-disabled'?: string,
    '--color-active'?: string,
    '--color-active-hover'?: string,
    '--color-active-pressed'?: string,
    '--color-active-disabled'?: string,
    '--font-color-normal'?: string,
    '--font-color-hover'?: string,
    '--font-color-pressed'?: string,
    '--font-color-disabled'?: string,
    '--font-color-active'?: string,
    '--font-color-active-hover'?: string,
    '--font-color-active-pressed'?: string,
    '--font-color-active-disabled'?: string,
}

export const ColorSchemeBlue = markRaw<ColorScheme>({
    '--focus-color': 'rgba(70, 111, 214, 0.4)',
    '--border-color-normal': 'rgb(145, 170, 232)',
    '--border-color-disabled': 'rgb(220, 220, 220)',
    '--border-color-active-disabled': 'rgb(205, 218, 253)',
    '--placeholder-color': 'rgb(178 199 255)',
    '--placeholder-color-disabled': 'rgb(220, 220, 220)',
    '--color-normal': 'rgb(222, 231, 255)',
    '--color-hover': 'rgb(205, 218, 253)',
    '--color-pressed': 'rgb(70, 111, 214)',
    '--color-disabled': 'rgb(249, 249, 249)',
    '--color-active': 'rgb(70, 111, 214)',
    '--color-active-hover': 'rgb(103, 137, 224)',
    '--color-active-pressed': 'rgb(145, 170, 232)',
    '--color-active-disabled': 'rgb(145, 170, 232)',
    '--font-color-normal': 'rgb(70, 111, 214)',
    '--font-color-hover': 'rgb(70, 111, 214)',
    '--font-color-pressed': 'rgb(255, 255, 255)',
    '--font-color-disabled': 'rgb(200, 200, 200)',
    '--font-color-active': 'rgb(255, 255, 255)',
    '--font-color-active-hover': 'rgb(255, 255, 255)',
    '--font-color-active-pressed': 'rgb(255, 255, 255)',
    '--font-color-active-disabled': 'rgb(255, 255, 255)',
});

export const ColorSchemeRed = markRaw<ColorScheme>({
    '--focus-color': 'rgb(244, 64, 64, 0.4)',
    '--border-color-normal': 'rgb(255 159 159)',
    '--border-color-disabled': 'rgb(220, 220, 220)',
    '--border-color-active-disabled': 'rgb(255, 220, 220)',
    '--placeholder-color': 'rgb(255 200 200)',
    '--placeholder-color-disabled': 'rgb(220, 220, 220)',
    '--color-normal': 'rgb(255, 233, 233)',
    '--color-hover': 'rgb(255, 220, 220)',
    '--color-pressed': 'rgb(244, 64, 64)',
    '--color-disabled': 'rgb(249, 249, 249)',
    '--color-active': 'rgb(244, 64, 64)',
    '--color-active-hover': 'rgb(250, 86, 86)',
    '--color-active-pressed': 'rgb(245, 180, 180)',
    '--color-active-disabled': 'rgb(245, 180, 180)',
    '--font-color-normal': 'rgb(244, 64, 64)',
    '--font-color-hover': 'rgb(244, 64, 64)',
    '--font-color-pressed': 'rgb(255, 255, 255)',
    '--font-color-disabled': 'rgb(200, 200, 200)',
    '--font-color-active': 'rgb(255, 255, 255)',
    '--font-color-active-hover': 'rgb(255, 255, 255)',
    '--font-color-active-pressed': 'rgb(255, 255, 255)',
    '--font-color-active-disabled': 'rgb(255, 255, 255)',
});

export const ColorSchemeGreen = markRaw<ColorScheme>({
    '--focus-color': 'rgb(36 177 57 / 40%)',
    '--border-color-normal': 'rgb(136 208 180)',
    '--border-color-disabled': 'rgb(220, 220, 220)',
    '--border-color-active-disabled': 'rgb(194 239 222)',
    '--placeholder-color': 'rgb(154 226 199)',
    '--placeholder-color-disabled': 'rgb(220, 220, 220)',
    '--color-normal': 'rgb(210 248 231)',
    '--color-hover': 'rgb(194 239 222)',
    '--color-pressed': 'rgb(4, 185, 115)',
    '--color-disabled': 'rgb(249, 249, 249)',
    '--color-active': 'rgb(4, 185, 115)',
    '--color-active-hover': 'rgb(25 196 130)',
    '--color-active-pressed': 'rgb(150 223 195)',
    '--color-active-disabled': 'rgb(150 223 195)',
    '--font-color-normal': 'rgb(4, 185, 115)',
    '--font-color-hover': 'rgb(4, 185, 115)',
    '--font-color-pressed': 'rgb(255, 255, 255)',
    '--font-color-disabled': 'rgb(200, 200, 200)',
    '--font-color-active': 'rgb(255, 255, 255)',
    '--font-color-active-hover': 'rgb(255, 255, 255)',
    '--font-color-active-pressed': 'rgb(255, 255, 255)',
    '--font-color-active-disabled': 'rgb(255, 255, 255)',
});

const GlobalResizeObserver = new ResizeObserver(onGlobalResizeObserverCallback);
export type ResizeObserverCallback = (entry: ResizeObserverEntry) => void;
const ResizeObserverTargetCallbackMap: WeakMap<Element, Set<ResizeObserverCallback>> = new WeakMap();
function onGlobalResizeObserverCallback(entrise: ResizeObserverEntry[]) {
    for (const entry of entrise) {
        const target = entry.target;
        ResizeObserverTargetCallbackMap.get(target)?.forEach(c => c(entry));
    }
}

export function observeResize(el: Element, callback: ResizeObserverCallback) {
    if (ResizeObserverTargetCallbackMap.has(el)) {
        ResizeObserverTargetCallbackMap.get(el)?.add(callback);
    }
    else {
        ResizeObserverTargetCallbackMap.set(el, new Set([callback]));
        GlobalResizeObserver.observe(el);
    }
}

export function unobserveResize(el: Element, callback: ResizeObserverCallback) {
    if (ResizeObserverTargetCallbackMap.has(el)) {
        const callbacks = ResizeObserverTargetCallbackMap.get(el)!;
        callbacks.delete(callback);
        if (callbacks.size === 0) {
            ResizeObserverTargetCallbackMap.delete(el);
            GlobalResizeObserver.unobserve(el);
        }
    }
}

// popup rect calculation

const DefualtWindowMargin = 10;
const DefaultOffset = 3;
const DefaultMenuPopupSubMenuOffsetY = -4;

export type PreferedDirection = 0 | 1;

export function calcButtonPopupRect(button_rect: Rect, content_size: BoxSize, window_size: BoxSize, prefered_direction: PreferedDirection, offset: number = DefaultOffset, gap: BoxSize = { width: DefualtWindowMargin, height: DefualtWindowMargin }): Rect {
    const { width: gap_width, height: gap_height } = gap;
    const min_window_width = window_size.width - gap_width * 2;
    const min_window_height = window_size.height - gap_height * 2;
    const base_width = Math.max(content_size.width, button_rect.width);
    const base_height = content_size.height;
    const top_space = Math.min(button_rect.y - gap_height, min_window_height) - offset;
    const bottom_space = window_size.height - gap_height - button_rect.y - button_rect.height - offset;
    const left_space = Math.min(button_rect.x + button_rect.width - gap_width, min_window_width);
    const right_space = window_size.width - gap_width - button_rect.x;
    let x: number, y: number, width: number, height: number;
    if (bottom_space >= top_space || bottom_space >= top_space) {
        height = Math.min(base_height, bottom_space);
        y = button_rect.y + button_rect.height + offset;
    }
    else {
        height = Math.min(base_height, top_space);
        y = gap_height + top_space - height;
    }
    if (prefered_direction === 0) {
        if (right_space >= base_width || right_space >= left_space) {
            width = Math.min(base_width, right_space);
            x = button_rect.x;
        }
        else {
            width = Math.min(base_width, left_space);
            x = gap_width + left_space - width;
        }
    }
    else {
        if (left_space >= base_width || left_space >= right_space) {
            width = Math.min(base_width, left_space);
            x = gap_width + left_space - width;
        }
        else {
            width = Math.min(base_width, right_space);
            x = button_rect.x;
        }
    }
    return { x, y, width, height };
}

export function calcMenuPopupRect(content_size: BoxSize, button_rect: Rect, window_size: BoxSize, prefered_direction: PreferedDirection, offset: BoxSize = { width: 0, height: DefaultMenuPopupSubMenuOffsetY }, allow_shift_up: boolean = true, gap: BoxSize = { width: DefualtWindowMargin, height: DefualtWindowMargin }): { rect: Rect, direction: PreferedDirection } {
    const { width: gap_width, height: gap_height } = gap;
    const { width: offset_width, height: offset_height } = offset;
    const min_window_width = window_size.width - gap_width * 2;
    const min_window_height = window_size.height - gap_height * 2;
    const right_space = (window_size.width - button_rect.x - button_rect.width) - gap_width - offset_width;
    const left_space = Math.min(button_rect.x - gap_width - offset_width, min_window_width);
    let x: number, y: number, width: number, height: number, direction: 0 | 1;
    if (prefered_direction === 0) {
        // right
        if (right_space >= content_size.width) {
            x = button_rect.x + button_rect.width + offset_width;
            width = content_size.width;
            direction = 0;
        }
        else if (left_space >= content_size.width) {
            x = button_rect.x - offset_width - content_size.width;
            width = content_size.width;
            direction = 1;
        }
        else if (right_space >= left_space) {
            width = right_space;
            x = button_rect.x + button_rect.width + offset_width;
            direction = 0;
        }
        else {
            width = left_space;
            x = button_rect.x - offset_width - left_space;
            direction = 1;
        }
    }
    else {
        // left
        if (left_space >= content_size.width) {
            x = button_rect.x - offset_width - content_size.width;
            width = content_size.width;
            direction = 1;
        }
        else if (right_space >= content_size.width) {
            x = button_rect.x + button_rect.width + offset_width;
            width = content_size.width;
            direction = 0;
        }
        else if (left_space >= right_space) {
            width = left_space;
            x = button_rect.x - offset_width - left_space;
            direction = 1;
        }
        else {
            width = right_space;
            x = button_rect.x + button_rect.width + offset_width;
            direction = 0;
        }
    }
    const bottom_space = window_size.height - button_rect.y - gap_height - offset_height;
    if (bottom_space >= content_size.height) {
        y = button_rect.y + offset_height;
        height = content_size.height;
    }
    else if (allow_shift_up) {
        height = Math.min(content_size.height, min_window_height);
        y = window_size.height - gap_height - height;
    }
    else {
        y = button_rect.y + offset_height;
        height = bottom_space;
    }
    return {
        rect: { x, y, width, height },
        direction: direction,
    };
}

// timer

function clearTimeoutId(id: number | undefined) {
    clearTimeout(id);
    // console.log('cancel timer');
}

export type TimerCanceller = () => void;
export function timer(func: () => void, time_ms: number): TimerCanceller {
    // console.log('start timer');
    const timeout_id = setTimeout(func, time_ms);
    return clearTimeoutId.bind(undefined, timeout_id);
}

// focus trap

export function getFocusables(dom: HTMLElement) {
    const focusables = dom.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]):not(.__sun-design-panel-trapfocus__)');
    return focusables;
}

export class TrapFocusOutEvent extends Event {
    private _defaultPrevented: boolean = false;

    public get defaultPrevented() { return this._defaultPrevented; }

    constructor() {
        super('TrapFocusOutEvent');
    }

    public preventDefault(): void {
        this._defaultPrevented = true;
    }
}