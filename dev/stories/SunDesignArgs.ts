import { ColorSchemeBlue, ColorSchemeGreen, ColorSchemeRed, type BorderMask, type Size, type ColorScheme } from "@/sundesign/SunDesignConstants";
import { useWindow } from '../../src/sundesign/window/SunWindowConstants';

export const Decorators = [
    () => {
        useWindow();
        document.body?.classList?.add('__sun-design__', 'color-def');
        return {
            template: `
            <div class="__sun-design__ color-def" style="display: flex; gap: 0.5em; align-items: center;">
                <story/>
            </div>
        ` };
    },
];

export const SizeArgsTypes = {
    size: {
        options: ['small', 'normal', 'large'],
        control: { type: 'radio' },
    },
}

export const ColorSchemeArgsTypes = {
    colorScheme: {
        options: ['normal', 'red', 'green', 'blue'],
        control: { type: 'radio' },
        mapping: {
            normal: undefined,
            red: ColorSchemeRed,
            green: ColorSchemeGreen,
            blue: ColorSchemeBlue,
        }
    },
}

export const BorderMaskArgsTypes = {
    borderMask: {
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    },
}

export const ArgsTypes = {
    ...SizeArgsTypes,
    ...BorderMaskArgsTypes,
    ...ColorSchemeArgsTypes,
}

export const SizeArgs = {
    size: 'normal' as Size,
}

export const ColorSchemeArgs = {
    colorScheme: undefined as (ColorScheme | undefined),
}

export const BorderMaskArgs = {
    borderMask: 15 as (BorderMask | undefined),
}

export const Args = {
    ...SizeArgs,
    ...BorderMaskArgs,
    ...ColorSchemeArgs,
}