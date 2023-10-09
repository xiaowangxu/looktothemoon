<template>
    <div style="position: relative;">
        <input class="__s__ __s_color__ __s_lineedit__" :class="{ clearable }" :style="{ '--SColor': color }"
            data-s-min-size="normal" value="123Test" :disabled="disabled">
        <SButton v-if="clearable" :disabled="disabled" :color="color" icon-only flat
            style="position: absolute; right: 0px; top: 0px;">
            <X />
        </SButton>
    </div>
</template>
<script setup lang="ts">
import SButton from './SButton.vue';
import { X } from 'lucide-vue-next';
import './SStyle.css';
withDefaults(
    defineProps<{ color?: string, clearable?: boolean, disabled?: boolean }>(),
    { color: 'var(--ThemeDisabledBaseColor)', clearable: true, disabled: false }
);
</script>
<style>
.__s_lineedit__ {
    appearance: none;
    text-wrap: nowrap;
    min-width: fit-content;
    vertical-align: middle;
    font-size: var(--FontSize);
    border: none;
    border-radius: var(--NormalRadius);
    padding: var(--NormalPaddingSize) calc(var(--NormalPaddingSize) + 4px);
    box-sizing: border-box;
}

.__s_lineedit__.__s_color__:active {
    background-color: var(--SColorHover);
    color: var(--SColor);
}

.__s_lineedit__.__s_color__:disabled {
    background-color: var(--ThemeDisabledBGColor);
    color: var(--ThemeDisabledColor);
}

.__s_lineedit__.clearable {
    padding-right: calc(var(--NormalPaddingSize) + 4px + var(--NormalIconSize));
}
</style>