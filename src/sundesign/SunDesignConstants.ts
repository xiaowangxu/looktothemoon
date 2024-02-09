import './SunDesignStyle.styl';
import { type CSSProperties, markRaw, toRef, type Ref, readonly } from 'vue';

export type Size = 'small' | 'normal' | 'large';

export type Align = 'start' | 'center' | 'end';

export type BorderMask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

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
    iconOnly?: boolean,
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

export const DefualtWindowMargin = 10;
export const DefaultOffset = 3;
export const DefaultMenuPopupSubMenuOffsetY = -4;

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
    if (bottom_space >= base_height || bottom_space >= top_space) {
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

// cacher

export function cachecall<F extends (...args: any[]) => any>(f: F): { call: (...args: Parameters<F>) => ReturnType<F>, clear: () => void } {
    let last_params: Parameters<F> | undefined = undefined;
    let last_result: ReturnType<F> | undefined = undefined;
    return {
        call: (...args: Parameters<F>) => {
            let re_call = false;
            if (last_params === undefined) {
                re_call = true;
            }
            else {
                if (last_params.length !== args.length) {
                    re_call = true;
                }
                else {
                    for (let i = 0; i < args.length; i++) {
                        if (last_params[i] !== args[i]) {
                            re_call = true;
                            break;
                        }
                    }
                }
            }
            if (re_call) {
                last_params = args;
                last_result = f(...last_params);
                return last_result as ReturnType<F>;
            }
            else {
                return last_result as ReturnType<F>;
            }
        },
        clear: () => {
            last_params = undefined;
            last_result = undefined;
        },
    };
}

// focus trap

export function getFocusables(dom: HTMLElement) {
    const focusables = dom.querySelectorAll('button:not(:disabled, .disabled), [href]:not(:disabled, .disabled), input:not(:disabled, .disabled), select:not(:disabled, .disabled), textarea:not(:disabled, .disabled), [tabindex]:not(:disabled, .disabled):not([tabindex="-1"]):not(.__sun-design-panel-trapfocus__)');
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

// drag

export interface DragData {
    type: string,
}

let DraggingData: DragData[] | undefined = undefined;

export function setDragData(evt: DragEvent, data: DragData[]) {
    DraggingData = data;
}

export function clearDragData() {
    DraggingData = undefined;
}

export function getDragData<T extends DragData>(evt: DragEvent, type: T['type']) {
    if (DraggingData === undefined) return undefined;
    const datas = DraggingData;
    for (const data of datas) {
        if (data.type === type) {
            return data as T;
        }
    }
    return undefined;
}

export function setDragImage(evt: DragEvent, message: string | string[] = '放置项目', size: Size = 'small', offset: BoxSize = { width: -18, height: -8 }) {
    const messages = message instanceof Array ? message : [message];
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '4px';
    container.style.position = 'fixed';
    container.style.bottom = '-1000px';
    container.style.flexWrap = 'nowrap';
    container.style.justifyContent = 'flex-start';
    for (const msg of messages.sort((a, b) => b.length - a.length).slice(0, 2)) {
        const dom = document.createElement('div');
        dom.className = '__sun-design__ colored sized bordered border-masked';
        dom.innerHTML = `<span class="__sun-design__" style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${msg}</span>`;
        dom.dataset.size = size;
        if (messages.length > 2) {
            dom.style.marginLeft = '10px';
        }
        dom.style.overflow = 'hidden';
        dom.style.maxWidth = '160px';
        dom.style.width = 'fit-content';
        dom.style.display = 'inline-flex';
        dom.style.flexWrap = 'nowrap';
        container.appendChild(dom);
    }
    if (messages.length > 2) {
        const dom = document.createElement('div');
        dom.className = '__sun-design__ colored sized bordered border-masked rounded';
        dom.innerHTML = `<span class="__sun-design__" style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">+ ${messages.length} 项目</span>`;
        dom.dataset.size = size;
        dom.style.overflow = 'hidden';
        dom.style.maxWidth = '160px';
        dom.style.width = 'fit-content';
        dom.style.display = 'inline-flex';
        dom.style.flexWrap = 'nowrap';
        container.prepend(dom);
        const dom2 = document.createElement('div');
        dom2.className = '__sun-design__ sized';
        dom2.innerHTML = `<span class="__sun-design__" style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">:</span>`;
        dom2.dataset.size = size;
        dom2.style.paddingTop = '0px';
        dom2.style.marginLeft = '10px';
        dom2.style.overflow = 'hidden';
        dom2.style.maxWidth = '160px';
        dom2.style.width = 'fit-content';
        dom2.style.display = 'inline-flex';
        dom2.style.flexWrap = 'nowrap';
        container.append(dom2);
    }
    document.body.appendChild(container);
    evt.dataTransfer!.setDragImage(container, offset.width, offset.height);
    setTimeout(() => {
        document.body.removeChild(container);
    }, 0);
}

// composables

type ModifiersKeyNameString<T extends string | number | symbol> = T extends string ? (T extends 'modelValue' ? 'modelModifiers' : `${T}Modifiers`) : never;

interface UseInputModelOptions<T> {
    set?: (val: T, modifiers: Record<string, boolean> | undefined) => T,
    forceUpdate?: boolean,
    skipEqualityCheck?: boolean,
    emitInput?: string,
    emitChange?: string,
};

export function useInputModel<P extends object, ValKey extends keyof P & string, ModifiersKey extends keyof P & string & ModifiersKeyNameString<ValKey>, Name extends string>(props: P, val_key: ValKey, modifiers_key: ModifiersKey, emit: (name: Name, ...args: any[]) => void, options?: UseInputModelOptions<P[ValKey]>) {
    const value = readonly(toRef(props, val_key));
    const set = options?.set;
    const emitInput = options?.emitInput;
    const emitChange = options?.emitChange;
    const modifiers = toRef(props, modifiers_key);
    const update_event = `update:${val_key}`;
    const forceUpdate = options?.forceUpdate ?? false;
    const skipEqualityCheck = options?.skipEqualityCheck ?? false;
    return {
        value: value,
        setValueOnInput: (val: P[ValKey]) => {
            const v = set?.(val, modifiers.value) ?? val
            if (forceUpdate || (!(modifiers.value?.lazy ?? false) && (skipEqualityCheck || value.value !== val))) {
                emit(update_event as any, v);
            }
            if (emitInput !== undefined && emit !== undefined) {
                emit(emitInput as any, v);
            }
        },
        setValueOnChange: (val: P[ValKey]) => {
            const v = set?.(val, modifiers.value) ?? val
            if (forceUpdate || ((modifiers.value?.lazy ?? false) && (skipEqualityCheck || value.value !== val))) {
                emit(update_event as any, v);
            }
            if (emitChange !== undefined && emit !== undefined) {
                emit(emitChange as any, v);
            }
        }
    }
}