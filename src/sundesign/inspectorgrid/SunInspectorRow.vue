<template>


    <div class="__sun-design-inspector-label-container__"
        style="padding: 0px 4px;  display: flex; gap: 4px; justify-content: flex-start;">
        <SunLabel style="flex: 1; text-align: end; max-width: 100px;">{{ label }}</SunLabel>
        <!-- border-right: 1px solid var(--border-color-normal); -->
        <!-- <SunButton class="__sun-design-inspector-row-reset__" flat squared size="small" style="align-self: center;">
            <Undo2 />
        </SunButton> -->
    </div>
    <slot>
        <div></div>
    </slot>

    <!-- <SunButton class="__sun-design-inspector-row-reset__" flat squared size="small" style="align-self: center;">
        <Undo2 />
    </SunButton> -->

</template>

<script setup lang="ts">

import SunLabel from '../label/SunLabel.vue';
import SunButton from '../button/SunButton.vue';
import { Undo2 } from 'lucide-vue-next';

const props = withDefaults(
    defineProps<{
        label?: string,
    }>(),
    {

    }
);

</script>

<style lang="stylus">

</style>