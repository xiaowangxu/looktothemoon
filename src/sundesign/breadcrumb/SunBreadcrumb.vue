<template>
    <div class="__sun-design-breadcrumb-container__">
        <SunButton v-if="options.length <= 0" disabled squared flat>
            <ChevronRight />
        </SunButton>
        <template v-for="option, idx in options" :key="option.item.uid">
            <SunSelect :size="size" flat icon-only squared :model-value="option.item.uid"
                :disabled="disabled || option.item.disabled || option.siblings === undefined || option.siblings.length <= 0"
                :options="option.siblings === undefined ? undefined : [option.siblings]">
                <template #closed>
                    <slot name="separator">
                        <ChevronRight />
                    </slot>
                </template>
            </SunSelect>
            <SunButton :size="size" flat :active="active && idx === options.length - 1"
                :disabled="disabled || option.item.disabled" :squared="option.item.label === undefined">
                <SunButtonItem :label="option.item.label" :icon="option.item.icon"></SunButtonItem>
            </SunButton>
        </template>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunSelect from '../select/SunSelect.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import { ChevronRight } from 'lucide-vue-next';
import type { Item, Size } from '../SunDesignConstants';

export type BreadcrumbItem = { item: Item, siblings?: Item[] };

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        options: BreadcrumbItem[],
        active?: boolean,
        disabled?: boolean,
    }>(),
    {
        size: 'normal',
        active: false,
        disabled: false,
    }
);

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-breadcrumb-container__
    display: flex
    flex-wrap: nowrap
    gap: (panel-padding / 2)

</style>