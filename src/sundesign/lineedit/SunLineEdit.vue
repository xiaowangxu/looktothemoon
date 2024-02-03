<template>
    <input ref="input_ref" class="__sun-design__ __sun-design-lineedit__ colored sized border-masked no-pressed-color"
        :class="{ flat, bordered: !flat, hover }" :disabled="disabled" :data-size="size" :data-border-mask="borderMask"
        :style="colorScheme" :value="value" @input="onInput" @change="onChange">
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size, type BorderMask, type ColorScheme, useInputModel } from '../SunDesignConstants';
import { ref, watch } from 'vue';
import { useVModel } from '@vueuse/core/index.cjs';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        borderMask?: BorderMask,
        hover?: boolean,
        disabled?: boolean,
        colorScheme?: ColorScheme,
        // value
        modelValue: string,
        modelModifiers?: Record<string, boolean>,
    }>(),
    {
        size: 'normal',
        flat: false,
        borderMask: 15,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', val: string): void,
    (event: 'input', val: string): void,
    (event: 'change', val: string): void,
}>();

const { value, setValueOnInput, setValueOnChange } = useInputModel(props, 'modelValue', 'modelModifiers', emits, { emitInput: 'input', emitChange: 'change' });

// datas
const input_ref = ref<HTMLInputElement | null>(null);

function onInput(evt: Event) {
    setValueOnInput((evt.target as HTMLInputElement).value);
}

function onChange(evt: Event) {
    setValueOnChange((evt.target as HTMLInputElement).value);
}

// exposes
defineExpose({
    input: input_ref,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-lineedit__, .__sun-design__.__sun-design-lineedit__.flat

    &:focus-visible
        outline: none
    
</style>