import { type CSSProperties, readonly } from 'vue';

export type Size = 'small' | 'normal' | 'large';

export type BorderMask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export type BasicTypes = string | number | boolean | bigint | symbol;

export type LabelTypes = BasicTypes | undefined | null;

export type BoxSize = { width: number, height: number };

export type Position = { x: number, y: number };

export type Rect = Position & BoxSize;

export type PopupOpenMode = 'instance' | 'visibility';

export type UID = string | number | symbol | undefined;

export interface Item {
    asTitle?: boolean,
    label: LabelTypes,
    colorScheme?: ColorScheme,
    active?: boolean,
    disabled?: boolean,
    description?: string,
    uid: UID,
    shortcut?: string,
    icon?: string,
}

export interface ColorScheme extends CSSProperties {
    '--focus-color'?: string,
    '--border-color-normal'?: string,
    '--border-color-disabled'?: string,
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

export const ColorSchemeBlue = readonly<ColorScheme>({
    '--focus-color': 'rgba(70, 111, 214, 0.4)',
    '--border-color-normal': 'rgb(145, 170, 232)',
    '--border-color-disabled': 'rgb(220, 220, 220)',
    '--border-color-active-disabled': 'rgb(205, 218, 253)',
    '--color-normal': 'rgb(222, 231, 255)',
    '--color-hover': 'rgb(205, 218, 253)',
    '--color-pressed': 'rgb(70, 111, 214)',
    '--color-disabled': 'rgb(249, 249, 249)',
    '--color-active': 'rgb(70, 111, 214)',
    '--color-active-hover': 'rgb(103, 137, 224)',
    '--color-active-pressed': 'rgb(205, 218, 253)',
    '--color-active-disabled': 'rgb(145, 170, 232)',
    '--font-color-normal': 'rgb(70, 111, 214)',
    '--font-color-hover': 'rgb(70, 111, 214)',
    '--font-color-pressed': 'rgb(255, 255, 255)',
    '--font-color-disabled': 'rgb(200, 200, 200)',
    '--font-color-active': 'rgb(255, 255, 255)',
    '--font-color-active-hover': 'rgb(255, 255, 255)',
    '--font-color-active-pressed': 'rgb(70, 111, 214)',
    '--font-color-active-disabled': 'rgb(255, 255, 255)',
});

export const ColorSchemeRed = readonly<ColorScheme>({
    '--focus-color': 'rgb(244, 64, 64, 0.4)',
    '--border-color-normal': 'rgb(245, 180, 180)',
    '--border-color-disabled': 'rgb(220, 220, 220)',
    '--border-color-active-disabled': 'rgb(255, 220, 220)',
    '--color-normal': 'rgb(255, 233, 233)',
    '--color-hover': 'rgb(255, 220, 220)',
    '--color-pressed': 'rgb(244, 64, 64)',
    '--color-disabled': 'rgb(249, 249, 249)',
    '--color-active': 'rgb(244, 64, 64)',
    '--color-active-hover': 'rgb(250, 86, 86)',
    '--color-active-pressed': 'rgb(255, 220, 220)',
    '--color-active-disabled': 'rgb(245, 180, 180)',
    '--font-color-normal': 'rgb(244, 64, 64)',
    '--font-color-hover': 'rgb(244, 64, 64)',
    '--font-color-pressed': 'rgb(255, 255, 255)',
    '--font-color-disabled': 'rgb(200, 200, 200)',
    '--font-color-active': 'rgb(255, 255, 255)',
    '--font-color-active-hover': 'rgb(255, 255, 255)',
    '--font-color-active-pressed': 'rgb(244, 64, 64)',
    '--font-color-active-disabled': 'rgb(255, 255, 255)',
});

export const ColorSchemeGreen = readonly<ColorScheme>({
    '--focus-color': 'rgb(36 177 57 / 40%)',
    '--border-color-normal': 'rgb(136 208 180)',
    '--border-color-disabled': 'rgb(220, 220, 220)',
    '--border-color-active-disabled': 'rgb(194 239 222)',
    '--color-normal': 'rgb(210 248 231)',
    '--color-hover': 'rgb(194 239 222)',
    '--color-pressed': 'rgb(4, 185, 115)',
    '--color-disabled': 'rgb(249, 249, 249)',
    '--color-active': 'rgb(4, 185, 115)',
    '--color-active-hover': 'rgb(25 196 130)',
    '--color-active-pressed': 'rgb(74 209 157)',
    '--color-active-disabled': 'rgb(150 223 195)',
    '--font-color-normal': 'rgb(4, 185, 115)',
    '--font-color-hover': 'rgb(4, 185, 115)',
    '--font-color-pressed': 'rgb(255, 255, 255)',
    '--font-color-disabled': 'rgb(200, 200, 200)',
    '--font-color-active': 'rgb(255, 255, 255)',
    '--font-color-active-hover': 'rgb(255, 255, 255)',
    '--font-color-active-pressed': 'rgb(4, 185, 115)',
    '--font-color-active-disabled': 'rgb(255, 255, 255)',
});

const GlobalResizeObserver = new ResizeObserver(on_GlobalResizeObserverCallback);
export type ResizeObserverCallback = (entry: ResizeObserverEntry) => void;
const ResizeObserverTargetCallbackMap: WeakMap<Element, Set<ResizeObserverCallback>> = new WeakMap();
function on_GlobalResizeObserverCallback(entrise: ResizeObserverEntry[]) {
    for (const entry of entrise) {
        const target = entry.target;
        ResizeObserverTargetCallbackMap.get(target)?.forEach(c => c(entry));
    }
}

export function observe_Resize(el: Element, callback: ResizeObserverCallback) {
    if (ResizeObserverTargetCallbackMap.has(el)) {
        ResizeObserverTargetCallbackMap.get(el)?.add(callback);
    }
    else {
        ResizeObserverTargetCallbackMap.set(el, new Set([callback]));
        GlobalResizeObserver.observe(el);
    }
}

export function unobserve_Resize(el: Element, callback: ResizeObserverCallback) {
    if (ResizeObserverTargetCallbackMap.has(el)) {
        const callbacks = ResizeObserverTargetCallbackMap.get(el)!;
        callbacks.delete(callback);
        if (callbacks.size === 0) {
            ResizeObserverTargetCallbackMap.delete(el);
            GlobalResizeObserver.unobserve(el);
        }
    }
}