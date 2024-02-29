<template>
    <div class="__sun-design-breadcrumb-container__">
        <SunButton v-if="showRoot" squared flat :disabled="rootDisabled" @click="$emit('clickRoot', $event)">
            <slot name="root">
                <ChevronRight />
            </slot>
        </SunButton>
        <template v-for="option, idx in options" :key="option.item.uid">
            <SunSelect v-if="idx !== 0" :size="size" flat icon-only squared :model-value="option.item.uid"
                :disabled="disabled || option.item.disabled || sorted_options[idx] === undefined || sorted_options[idx]!.length <= 0"
                :options="sorted_options[idx]" @change="onSelectChange">
                <template #closed>
                    <slot name="separator">
                        <ChevronRight />
                    </slot>
                </template>
            </SunSelect>
            <SunButton :size="size" flat :active="active && idx === options.length - 1"
                :disabled="disabled || option.item.disabled"
                :squared="(option.item as RenderBreadcrumbItem).render === undefined ? ((option.item as ItemBreadcrumbItem).iconOnly ?? false) : ((option.item as RenderBreadcrumbItem).squared ?? false)"
                @click="$emit('click', option.item.uid)">
                <SunButtonItem v-if="(option.item as RenderBreadcrumbItem).render === undefined"
                    :label="(option.item as ItemBreadcrumbItem).label" :icon="(option.item as ItemBreadcrumbItem).icon">
                </SunButtonItem>
                <component v-else :is="(option.item as RenderBreadcrumbItem).render"
                    :item="(option.item as RenderBreadcrumbItem)" />
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
import { computed, type Component, type Raw } from 'vue';

type ItemBreadcrumbItem<T extends UID = UID> = Item<T>;
type RenderBreadcrumbItem<T extends UID = UID> = {
    uid: T,
    squared?: boolean,
    disabled?: boolean,
    colorScheme?: ColorScheme,
    render: Raw<Component<{ item: RenderBreadcrumbItem<T> }>>,
};
export type BreadcrumbItem<T extends UID = UID> = { item: ItemBreadcrumbItem<T> | RenderBreadcrumbItem<T>, siblings?: SelectItem[] };

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        options: BreadcrumbItem[],
        active?: boolean,
        disabled?: boolean,
        filterSort?: (options: SelectItem[]) => SelectItem[],
        showRoot?: boolean,
        rootDisabled?: boolean,
    }>(),
    {
        size: 'normal',
        active: false,
        disabled: false,
        showRoot: true,
        rootDisabled: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'click', data: UID): void;
    (event: 'clickRoot', evt: MouseEvent): void;
}>();

// datas
const sorted_options = computed(() => {
    if (props.filterSort === undefined) return props.options.map(option => option.siblings === undefined || option.siblings.length <= 0 ? undefined : [option.siblings]);
    return props.options.map(option => {
        if (option.siblings === undefined || option.siblings.length <= 0) return undefined;
        const filter_sorted = props.filterSort!(option.siblings);
        if (filter_sorted.length <= 0) return undefined;
        return [filter_sorted];
    });
});

function onSelectChange(uid: UID | undefined) {
    if (uid !== undefined) {
        emits('click', uid);
    }
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-breadcrumb-container__
    display: flex
    flex-wrap: nowrap
    gap: (panel-padding / 2)

</style>