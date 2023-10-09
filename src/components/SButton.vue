<template>
    <button class="__s__ __s_button__" :class="{ flat, 'icon-only': iconOnly, active }" :data-icon-size="iconSize"
        :style="{ '--SColor': color }" @click="$emit('click', $event)">
        <slot name="default" />
    </button>
</template>
<script setup lang="ts">
import './SStyle.css';
withDefaults(
    defineProps<{ active?: boolean, color?: string, flat?: boolean, iconOnly?: boolean, iconSize?: 'normal' | 'medium' | 'large' }>(),
    { active: false, color: 'var(--ThemeColor)', flat: false, iconOnly: false, iconSize: 'normal' }
);
defineEmits<{
  (event: 'click', evt: Event): void
}>();
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

    font-size: var(--FontSize);
    border: none;
    border-radius: var(--NormalRadius);
    user-select: none;
    padding: var(--NormalPaddingSize) calc(var(--NormalPaddingSize) + 4px);
    background-color: color-mix(in srgb, var(--ThemeBaseColor), var(--SColor) 10%);
    color: var(--SColor);
}

.__s_button__.flat {
    background-color: transparent;
}

.__s_button__[data-icon-size="normal"] {
    gap: var(--NormalPaddingSize);
    padding: var(--NormalPaddingSize) calc(var(--NormalPaddingSize) + 4px);
}

.__s_button__[data-icon-size="medium"] {
    gap: var(--MediumPaddingSize);
    padding: var(--MediumPaddingSize) calc(var(--MediumPaddingSize) + 4px);
}

.__s_button__[data-icon-size="large"] {
    gap: var(--LargePaddingSize);
    padding: var(--LargePaddingSize) calc(var(--LargePaddingSize) + 4px);
}

.__s_button__.icon-only,
.__s_button__.icon-only[data-icon-size="normal"] {
    gap: var(--NormalPaddingSize);
    padding: var(--NormalPaddingSize);
}

.__s_button__.icon-only[data-icon-size="medium"] {
    gap: var(--MediumPaddingSize);
    padding: var(--MediumPaddingSize);
}

.__s_button__.icon-only[data-icon-size="large"] {
    gap: var(--LargePaddingSize);
    padding: var(--LargePaddingSize);
}

.__s_button__[data-icon-size="normal"]>svg {
    width: var(--NormalIconSize);
    height: var(--NormalIconSize);
    min-width: var(--NormalIconSize);
    min-height: var(--NormalIconSize);
}

.__s_button__[data-icon-size="medium"]>svg {
    width: var(--MediumIconSize);
    height: var(--MediumIconSize);
    min-width: var(--MediumIconSize);
    min-height: var(--MediumIconSize);
}

.__s_button__[data-icon-size="large"]>svg {
    width: var(--LargeIconSize);
    height: var(--LargeIconSize);
    min-width: var(--LargeIconSize);
    min-height: var(--LargeIconSize);
}

.__s_button__:hover {
    background-color: color-mix(in srgb, var(--ThemeBaseColor), var(--SColor) 20%);
    color: var(--SColor);
}

.__s_button__.flat:hover {
    background-color: color-mix(in srgb, var(--ThemeBaseColor), var(--SColor) 10%);
    color: var(--SColor);
}

.__s_button__.active,
.__s_button__.flat.active,
.__s_button__:active,
.__s_button__.flat:active {
    background-color: var(--SColor);
    color: var(--ThemeOppositeColor);
}

.__s_button__:focus {
    outline: var(--FocusOutlineWidth) solid color-mix(in srgb, transparent, var(--SColor) 30%);
}

.__s_button__:disabled {
    background-color: var(--ThemeDisabledBGColor);
    color: var(--ThemeDisabledColor);
}

.__s_button__.flat:disabled {
    background-color: transparent;
    color: var(--ThemeDisabledColor);
}
</style>