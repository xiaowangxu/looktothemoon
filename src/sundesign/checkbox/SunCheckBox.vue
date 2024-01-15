<template>
    <div class="__sun-design__ __sun-design-checkbox-container__" data-size="normal">
        <input class="__sun-design__ __sun-design-checkbox__" type="checkbox" />
        <div class="__sun-design-checkbox-icon__">
            <slot>
                <Check />
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { Check } from 'lucide-vue-next';

// props
// const props = withDefaults(
//     defineProps<{
//         value?: boolean,
//         label?: BasicTypes,
//         color?: string,
//         checkedColor?: string,
//         disabled?: boolean
//     }>(),
//     {
//         value: false,
//         color: 'var(--ThemeDisabledBaseColor)',
//         checkedColor: 'var(--ThemeColor)',
//         disabled: false,
//     }
// );

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-checkbox-container__
    background-color: unset
    padding-left: 0
    padding-right: 0
    position: relative

.__sun-design__.__sun-design-checkbox__, .__sun-design-checkbox-icon__
    margin: 0
    width: content-size-normal
    height: content-size-normal

.__sun-design-checkbox-icon__
    position: absolute

</style>