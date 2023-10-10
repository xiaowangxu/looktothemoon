import { computed, type Ref, toRef } from "vue";

export type Alignment = 'start' | 'center' | 'end';

export type IconSize = 'normal' | 'medium' | 'large';

export type TextSize = 'normal' | 'medium' | 'large' | 'inherit';

export interface TypographyProps {
    minWidth?: string,
    maxWidth?: string,
    width?: string,
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
    const width_css = useWidthCss(toRef(props, 'width'), toRef(props, 'minWidth'), toRef(props, 'maxWidth'));
    return { color_css, align_h_css, align_v_css, width_css };
}

export function useWidthCss(width: Ref<string | undefined>, min_width: Ref<string | undefined>, max_width: Ref<string | undefined>)
    : { width?: string, minWidth?: string, maxWidth?: string } {
    return computed(() => {
        if (width.value !== undefined) {
            return { width: width.value };
        }
        const result = {};
        if (min_width.value !== undefined) {
            result.minWidth = min_width.value;
        }
        if (max_width.value !== undefined) {
            result.maxWidth = max_width.value;
        }
        return result;
    });
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