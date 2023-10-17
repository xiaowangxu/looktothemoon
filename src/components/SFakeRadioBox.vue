<template>
    <div class="__s__ __s_color__ __s_fakeradiobox__" :class="{ checked: value, disabled, margin }"
        :style="{ '--SColor': color, '--STextColor': checkedColor }">
    </div>
</template>

<script setup lang="ts">

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
.__s_fakeradiobox__ {
    width: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    min-width: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    height: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    min-height: calc(var(--NormalMinSize) - var(--MediumPaddingSize) * 2);
    border-radius: 50%;
    box-sizing: border-box;
    background-color: var(--SColorNormal);
    border: none;
}

.__s_fakeradiobox__.margin {
    margin: calc(var(--MediumPaddingSize) - var(--NormalPaddingSize));
}

.__s_fakeradiobox__.checked {
    background-color: var(--ThemeOppositeColor);
    border: calc((var(--NormalMinSize) - var(--MediumPaddingSize) * 2) / 4) solid var(--STextColorActive);
}

.__s_fakeradiobox__.disabled {
    background-color: var(--ThemeDisabledBGColor);
    border: none;
}

.__s_fakeradiobox__.checked.disabled {
    background-color: var(--ThemeOppositeColor);
    border: calc((var(--NormalMinSize) - var(--MediumPaddingSize) * 2) / 4) solid var(--STextColorActiveDisabled);
}
</style>