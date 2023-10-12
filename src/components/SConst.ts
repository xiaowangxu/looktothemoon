import { computed, type Ref, toRef, type ComputedRef, watch } from "vue";

export type Alignment = 'start' | 'center' | 'end';

export type IconSize = 'normal' | 'medium' | 'large';

export type TextSize = 'small' | 'normal' | 'medium' | 'large' | 'inherit';

export type TextVerticalAlignment = 'top' | 'middle' | 'bottom' | 'baseline' | 'inherit';

export type BasicTypes = string | number | boolean | bigint | symbol;

export type BoxSize = { width: number, height: number };

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

/**
 * @param digits digit numbers after dot, exp: 3 -> 0.123
 * @param show_end_zeros for 0.123000 false -> 0.123 / true -> 0.123
 */
export function fixNumberString(num: number, digits: number, show_end_zeros: boolean = false): string {
    if (digits <= 0) digits = 0;
    if (show_end_zeros) return num.toFixed(digits);
    return num.toFixed(digits).replace(/\.0*$|(\.\d*[1-9])0+$/g, '$1');
}