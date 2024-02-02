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
                :disabled="disabled || option.item.disabled"
                :squared="(option.item as RenderBreadcrumbItem).render === undefined ? ((option.item as ItemBreadcrumbItem).iconOnly ?? false) : ((option.item as RenderBreadcrumbItem).squared ?? false)">
                <SunButtonItem v-if="(option.item as RenderBreadcrumbItem).render === undefined"
                    :label="(option.item as ItemBreadcrumbItem).label" :icon="(option.item as ItemBreadcrumbItem).icon">
                </SunButtonItem>
                <component v-else :is="(option.item as RenderBreadcrumbItem).render"/>
            </SunButton>
        </template>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunSelect, { type SelectItem } from '../select/SunSelect.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import { ChevronRight } from 'lucide-vue-next';
import type { ColorScheme, Item, Size, UID } from '../SunDesignConstants';
import type { Component, Raw } from 'vue';

type ItemBreadcrumbItem<T extends UID = UID> = Item<T>;
type RenderBreadcrumbItem<T extends UID = UID> = {
    uid: T,
    squared?: boolean,
    disabled?: boolean,
    colorScheme?: ColorScheme,
    render: Raw<Component<{
        uid: T,
    }>>,
};
export type BreadcrumbItem<T extends UID = UID> = { item: ItemBreadcrumbItem<T> | RenderBreadcrumbItem<T>, siblings?: SelectItem[] };

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