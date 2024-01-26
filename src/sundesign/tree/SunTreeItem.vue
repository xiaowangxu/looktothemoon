<template>
    <div class="__sun-design-tree-container__">
        <SunButton class="__sun-design-tree-item-container__ no-pressed-color" :hover="option.active"
            :color-scheme="option.colorScheme" :style="{ 'padding-left': padding_left }" flat no-pressed-color
            @click="onClick">
            <ChevronRight v-if="folded" />
            <ChevronDown v-else />
            <!-- <SunCheckbox :partial="has_subtree_hovered" @click.stop :checked="hovered || has_subtree_hovered" disabled /> -->
            <SunItemButtonEditable ref="itembutton_ref" :label="option.label" :icon="option.icon"
                :description="option.description" />
            <slot name="append" :option="option" />
        </SunButton>
        <div v-if="has_subs" v-show="!folded" class="__sun-design-tree-container__">
            <SunTreeItem v-for="item in option.subs" :option="item" :depth="depth + 1"
                @click="onSubTreeClick">
                <template #append="{ option }">
                    <slot name="append" :option="option" />
                </template>
            </SunTreeItem>
        </div>
    </div>
</template>

<script setup lang="ts">

import SunButton from '../button/SunButton.vue';
import SunItemButtonEditable from '../item/SunButtonItemEditable.vue';
import SunCheckbox from '../checkbox/SunCheckbox.vue';
import { ChevronRight, ChevronDown } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref } from 'vue';
import { type Item, type UID } from '../SunDesignConstants';

type ItemTreeItem<T extends UID = UID> = Omit<Item<T>, 'shortcut' | 'sub' | 'disabled'> & { subs?: TreeItem<T>[] };
// type RenderTreeItem<T extends UID = UID> = {
//     uid: T,
//     colorScheme?: ColorScheme,
//     renderButtonContent: Raw<Component<{
//         uid: T,
//     }>>,
//     render: Raw<Component<{
//         uid: T,
//         selected: boolean,
//         click: (uid: T, evt: Event) => void,
//     }>>,
// };
export type TreeItem<T extends UID = UID> = ItemTreeItem<T>; //| RenderTreeItem<T>;

//props
const props = withDefaults(
    defineProps<{
        option: TreeItem,
        depth?: number,
    }>(),
    {
        depth: 0,
    }
);

// slots
defineSlots<{
    append(props: { option: TreeItem }): void,
}>();

// emits
const emits = defineEmits<{
    (event: 'click', evt: Event): void,
}>();

// datas
const itembutton_ref = ref<InstanceType<typeof SunItemButtonEditable> | undefined>();
const has_subs = computed(() => props.option.subs !== undefined && props.option.subs.length > 0);
const padding_left = computed(() => props.depth === 0 ? undefined : `${props.depth * 20}px`);
const folded = ref(true);

function onClick(evt: Event) {
    folded.value = !folded.value;
    emits('click', evt);
}

function onSubTreeClick(evt: Event) {
    emits('click', evt);
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-tree-container__
    display: flex
    flex-direction: column
    overflow: hidden
    gap: (panel-padding / 2)

.__sun-design-tree-list-container__
    display: flex
    flex-direction: row
    flex: 1
    gap: panel-padding
    overflow: hidden

.__sun-design-tree-item-container__
    display: flex
    flex-direction: row
    gap: panel-padding
    width: 100%
    overflow: hidden
    padding-top: 0px !important
    padding-bottom: 0px !important

// .__sun-design-tree-item-drop-indicator__
//     position absolute
//     bottom: - (panel-padding / 2)
//     width: 100%
//     border-top: border-width var(--color-active) solid
//     transform: translate(0, 50%)

</style>