<template>
    <button ref="button_dom" class="__s__ __s_color__ __s_button__" :class="{ flat, 'icon-only': iconOnly, active }"
        :data-s-icon-size="iconSize" :data-s-min-size="iconSize" :style="{ '--SColor': color, justifyContent: align_text }"
        @click="emits('click', $event)">
        <slot name="default" />
    </button>
</template>

<script setup lang="ts">

import './SStyle.css';
import { useFlexAligmentCss, type Alignment, type IconSize, useHtmlElementFocusBlur } from './SConst';
import { toRef, ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{ active?: boolean, color?: string, flat?: boolean, iconOnly?: boolean, iconSize?: IconSize, alignText?: Alignment }>(),
    { active: false, color: 'var(--ThemeColor)', flat: false, iconOnly: false, iconSize: 'normal', alignText: 'start' }
);

// emits
const emits = defineEmits<{
    click: [event: Event],
}>();

// datas
const button_dom = ref<HTMLButtonElement>();
const align_text = useFlexAligmentCss(toRef(props, 'alignText'));

// methods
const { focus, blur } = useHtmlElementFocusBlur(button_dom);

// exposes
defineExpose({
    buttonElement: button_dom,
    focus, blur,
});

</script>

<style>
.__s_button__ {
    appearance: none;

    text-wrap: nowrap;
    min-width: fit-content;

    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;

    border: none;
    border-radius: var(--NormalRadius);
    user-select: none;
    padding: var(--NormalPaddingSize) calc(var(--NormalPaddingSize) + 4px);
}

.__s_button__[data-s-icon-size="normal"] {
    gap: var(--NormalPaddingSize);
    padding: var(--NormalPaddingSize) calc(var(--NormalPaddingSize) + 4px);
}

.__s_button__[data-s-icon-size="medium"] {
    gap: var(--MediumPaddingSize);
    padding: var(--MediumPaddingSize) calc(var(--MediumPaddingSize) + 4px);
}

.__s_button__[data-s-icon-size="large"] {
    gap: var(--LargePaddingSize);
    padding: var(--LargePaddingSize) calc(var(--LargePaddingSize) + 4px);
}

.__s_button__.icon-only,
.__s_button__.icon-only[data-s-icon-size="normal"] {
    padding: var(--NormalPaddingSize);
}

.__s_button__.icon-only[data-s-icon-size="medium"] {
    padding: var(--MediumPaddingSize);
}

.__s_button__.icon-only[data-s-icon-size="large"] {
    padding: var(--LargePaddingSize);
}

.__s_button__[data-s-icon-size="normal"]>svg {
    width: var(--NormalIconSize);
    height: var(--NormalIconSize);
    min-width: var(--NormalIconSize);
    min-height: var(--NormalIconSize);
}

.__s_button__[data-s-icon-size="medium"]>svg {
    width: var(--MediumIconSize);
    height: var(--MediumIconSize);
    min-width: var(--MediumIconSize);
    min-height: var(--MediumIconSize);
}

.__s_button__[data-s-icon-size="large"]>svg {
    width: var(--LargeIconSize);
    height: var(--LargeIconSize);
    min-width: var(--LargeIconSize);
    min-height: var(--LargeIconSize);
}

.__s_button__.flat {
    background-color: transparent;
}

.__s_button__.flat.active,
.__s_button__.flat:active {
    background-color: var(--SColorActive);
}

.__s_button__.flat:disabled {
    background-color: transparent;
}
</style>