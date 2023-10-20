import { computed, watch, ref, type Ref, toRef, type ComputedRef, type Directive } from "vue";

export type Alignment = 'start' | 'center' | 'end';

export type IconSize = 'normal' | 'medium' | 'large';

export type TextSize = 'small' | 'normal' | 'medium' | 'large' | 'inherit';

export type TextVerticalAlignment = 'top' | 'middle' | 'bottom' | 'baseline' | 'inherit';

export type BasicTypes = string | number | boolean | bigint | symbol;

export type LabelTypes = BasicTypes | undefined | null;

export type BoxSize = { width: number, height: number };

export type Position = { x: number, y: number };

export type Rect = Position & BoxSize;

export type PopupOpenMode = 'instance' | 'visibility';

export type UID = string | number | symbol | undefined;

export interface WidthDefineProps {
    minWidth?: string,
    maxWidth?: string,
    width?: string,
}

export interface HeightDefineProps {
    minHeight?: string,
    maxHeight?: string,
    height?: string,
}

export interface TypographyProps extends WidthDefineProps {
    alignH?: Alignment,
    alignV?: Alignment,
    color?: string,
    inheritColor?: boolean,
}

export function useTextAligmentCss(align: Ref<Alignment>) {
    return computed(() => {
        switch (align.value) {
            case 'start': return 'start';
            case 'center': return 'center';
            case 'end': return 'end';
        }
    });
}

export function useFlexAligmentCss(align: Ref<Alignment>) {
    return computed(() => {
        switch (align.value) {
            case 'start': return 'flex-start';
            case 'center': return 'center';
            case 'end': return 'flex-end';
        }
    });
}

export function useTypoGraphyCss(props: any) {
    const color_css = computed(() => props.inheritColor ? 'inherit' : props.color);
    const align_h_css = useTextAligmentCss(toRef(props, 'alignH'));
    const align_v_css = useFlexAligmentCss(toRef(props, 'alignV'));
    const width_css = useWidthDefineCss(toRef(props, 'width'), toRef(props, 'minWidth'), toRef(props, 'maxWidth'));
    return { color_css, align_h_css, align_v_css, width_css };
}

export function useWidthDefineCss(
    width: Ref<string | undefined>,
    min_width: Ref<string | undefined>,
    max_width: Ref<string | undefined>
): ComputedRef<{ width?: string, minWidth?: string, maxWidth?: string }> {
    return computed(() => {
        const result: { width?: string, minWidth?: string, maxWidth?: string } = {};
        if (width.value !== undefined) {
            result.width = width.value;
        }
        if (min_width.value !== undefined) {
            result.minWidth = min_width.value;
        }
        if (max_width.value !== undefined) {
            result.maxWidth = max_width.value;
        }
        return result;
    });
}

export function useHeightDefineCss(
    height: Ref<string | undefined>,
    min_height: Ref<string | undefined>,
    max_height: Ref<string | undefined>
): ComputedRef<{ height?: string, minHeight?: string, maxHeight?: string }> {
    return computed(() => {
        const result: { height?: string, minHeight?: string, maxHeight?: string } = {};
        if (height.value !== undefined) {
            result.height = height.value;
        }
        if (min_height.value !== undefined) {
            result.minHeight = min_height.value;
        }
        if (max_height.value !== undefined) {
            result.maxHeight = max_height.value;
        }
        return result;
    });
}

export function useHtmlElementFocusBlur(el: Ref<HTMLElement | undefined>): { focus: () => void, blur: () => void } {
    return {
        focus() {
            el.value?.focus();
        },
        blur() {
            el.value?.blur();
        }
    };
}

export function useComponentRefFocusBlur<T extends abstract new (...args: any) => any>(
    component: Ref<(InstanceType<T> & {
        focus: () => void,
        blur: () => void,
    }) | undefined>
): { focus: () => void, blur: () => void } {
    return {
        focus() {
            component.value?.focus?.();
        },
        blur() {
            component.value?.blur?.();
        }
    };
}

export function usePopupPanelMeasureRect(opened: Ref<boolean>, dom: Ref<HTMLElement | undefined>, instance_mode: Ref<boolean>) {
    const content_size = ref<BoxSize | undefined>();
    watch(opened, (newval) => {
        if (newval) {
            if (!instance_mode.value) {
                const { width, height } = dom.value?.getBoundingClientRect()!;
                content_size.value = {
                    width: width, height: height,
                };
            }
        }
        else {
            content_size.value = undefined;
        }
    });
    watch(dom, (newval) => {
        if (!newval) return;
        const { width, height } = dom.value?.getBoundingClientRect()!;
        content_size.value = {
            width: width, height: height,
        };
    });
    return computed(() => opened.value ? content_size.value : undefined);
}

export const vFocus: Directive = {
    mounted(el) {
        if (el instanceof HTMLElement) {
            el.focus();
        }
    },
};

/**
 * @param digits digit numbers after dot, exp: 3 -> 0.123
 * @param show_end_zeros for 0.123000 false -> 0.123 / true -> 0.123
 */
export function fixNumberString(num: number, digits: number, show_end_zeros: boolean = false): string {
    if (digits <= 0) digits = 0;
    if (show_end_zeros) return num.toFixed(digits);
    return num.toFixed(digits).replace(/\.0*$|(\.\d*[1-9])0+$/g, '$1');
}

export function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

export function calcSelectPopupSize(content_size: BoxSize, button_rect: Rect, window_size: BoxSize, gap: BoxSize = { width: 7, height: 6 }): Rect {
    const { width: gap_width, height: gap_height } = gap;
    const min_window_width = window_size.width - gap_width * 2;
    const min_window_height = window_size.height - gap_height * 2;
    const base_width = Math.max(content_size.width, button_rect.width);
    const base_height = content_size.height;
    const top_space = Math.min(button_rect.y - gap_height, min_window_height);
    const bottom_space = window_size.height - gap_height - button_rect.y - button_rect.height;
    const left_space = Math.min(button_rect.x + button_rect.width - gap_width, min_window_width);
    const right_space = window_size.width - gap_width - button_rect.x;
    let x: number, y: number, width: number, height: number;
    if (bottom_space >= top_space || bottom_space >= top_space) {
        height = Math.min(base_height, bottom_space);
        y = button_rect.y + button_rect.height;
    }
    else {
        height = Math.min(base_height, top_space);
        y = gap_height + top_space - height;
    }
    if (right_space >= base_width || right_space >= left_space) {
        width = Math.min(base_width, right_space);
        x = button_rect.x;
    }
    else {
        width = Math.min(base_width, left_space);
        x = gap_width + left_space - width;
    }
    return { x, y, width, height };
}

export function calcPopupMenuPopupSize(content_size: BoxSize, button_rect: Rect, window_size: BoxSize, prefered_direction: 0 | 1, offset: BoxSize = { width: 0, height: -5 }, allow_shift_up: boolean = true, gap: BoxSize = { width: 7, height: 6 }): { rect: Rect, direction: 0 | 1 } {
    const { width: gap_width, height: gap_height } = gap;
    const { width: offset_width, height: offset_height } = offset;
    const min_window_width = window_size.width - gap_width * 2;
    const min_window_height = window_size.height - gap_height * 2;
    const right_space = (window_size.width - button_rect.x - button_rect.width) - gap_width - offset_width;
    const left_space = Math.min(button_rect.x - gap_width - offset_width, min_window_width);
    let x: number, y: number, width: number, height: number, direction: 0 | 1;
    if (prefered_direction === 1) {
        // right
        if (right_space >= content_size.width) {
            x = button_rect.x + button_rect.width + offset_width;
            width = content_size.width;
            direction = 1;
        }
        else if (left_space >= content_size.width) {
            x = button_rect.x - offset_width - content_size.width;
            width = content_size.width;
            direction = 0;
        }
        else if (right_space >= left_space) {
            width = right_space;
            x = button_rect.x + button_rect.width + offset_width;
            direction = 1;
        }
        else {
            width = left_space;
            x = button_rect.x - offset_width - left_space;
            direction = 0;
        }
    }
    else {
        // left
        if (left_space >= content_size.width) {
            x = button_rect.x - offset_width - content_size.width;
            width = content_size.width;
            direction = 0;
        }
        else if (right_space >= content_size.width) {
            x = button_rect.x + button_rect.width + offset_width;
            width = content_size.width;
            direction = 1;
        }
        else if (left_space >= right_space) {
            width = left_space;
            x = button_rect.x - offset_width - left_space;
            direction = 0;
        }
        else {
            width = right_space;
            x = button_rect.x + button_rect.width + offset_width;
            direction = 1;
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

export type TimerCanceller = () => void;

export function timer(func: () => void, time: number): TimerCanceller {
    let cancelled = false, finished = false;
    // console.log('start timer');
    setTimeout(() => {
        if (cancelled || finished) return;
        func(); finished = true;
        // console.log('timer finished');
    }, time);
    return () => {
        if (!cancelled && !finished) {
            // console.log('cancel timer');
            cancelled = true;
        }
    };
}

const GlobalResizeObserver = new ResizeObserver(on_GlobalResizeObserverCallback);
export type ResizeObserverCallback = (entry: ResizeObserverEntry) => void;
const ResizeObserverTargetCallbackMap: Map<Element, Set<ResizeObserverCallback>> = new Map();
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