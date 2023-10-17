<template>
    <div class="__s__ __s_color__ __s_fakecheckbox__" :class="{ checked: value, disabled, margin }"
        :style="{ '--SColor': color, '--STextColor': checkedColor }">
        <div class="__s_fakecheckbox_icon__">
            <slot>
                <Check />
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">

import { Check } from 'lucide-vue-next';

// props
const props = withDefaults(
    defineProps<{
        value?: boolean,
        color?: string,
        checkedColor?: string,
        disabled?: boolean,
        margin?: boolean,
    }>(),
    {
        value: false,
        color: 'var(--ThemeDisabledBaseColor)',
        checkedColor: 'var(--ThemeColor)',
        disabled: false,
        margin: true,
    }
);

</script>

<style>
.__s_fakecheckbox__ {
    width: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    min-width: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    height: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    min-height: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    border-radius: var(--SquareRadius);
    box-sizing: border-box;
    position: relative;
    background-color: var(--SColorNormal);
}

.__s_fakecheckbox__.margin {
    margin: calc(var(--MediumPaddingSize) - var(--NormalPaddingSize));
}

.__s_fakecheckbox_icon__ {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0px;
    box-sizing: border-box;
    color: var(--ThemeOppositeColor);
    visibility: hidden;
}

.__s_fakecheckbox_icon__>* {
    width: 100% !important;
    height: 100% !important;
    min-width: unset !important;
    min-height: unset !important;
}

.__s_fakecheckbox__.checked {
    background-color: var(--STextColorActive);
}

.__s_fakecheckbox__.checked>.__s_fakecheckbox_icon__ {
    visibility: visible;
}

.__s_fakecheckbox__.disabled {
    background-color: var(--ThemeDisabledBGColor);
}

.__s_fakecheckbox__.checked.disabled {
    background-color: var(--STextColorActiveDisabled);
}
</style>