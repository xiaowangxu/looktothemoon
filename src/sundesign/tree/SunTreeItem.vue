<template>
    <SunButton class="__sun-design-tree-item-container__ no-pressed-color" draggable="true" :size="size"
        :hover="option.active" :color-scheme="option.colorScheme" flat no-pressed-color @click="onClick">
        <ChevronRight v-if="folded" class="__sun-design-tree-arrow__" />
        <ChevronDown v-else class="__sun-design-tree-arrow__" />
        <SunCheckbox @click.stop :size="size" />
        <SunItemButtonEditable ref="itembutton_ref" :label="option.label" :icon="option.icon"
            :description="option.description" />
        <slot name="append" :option="option" />
    </SunButton>
    <div v-if="has_subs" v-show="!folded" class="__sun-design-tree-container__ __sun-design-tree-relation__"
        :class="{ 'no-folder-line': !folderLine }" :style="{ '--Depth': depth + 1 }" :data-size="size"
        :stylew="option.colorScheme">
        <SunTreeItem v-for="item in option.subs" :size="size" :folder-line="folderLine" :option="item" :depth="depth + 1"
            @click="onSubTreeClick">
            <template #append="{ option }">
                <slot name="append" :option="option" />
            </template>
        </SunTreeItem>
    </div>
</template>

<script setup lang="ts">

import SunButton from '../button/SunButton.vue';
import SunItemButtonEditable from '../item/SunButtonItemEditable.vue';
import SunCheckbox from '../checkbox/SunCheckbox.vue';
import { ChevronRight, ChevronDown } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref } from 'vue';
import { type Size, type Item, type UID } from '../SunDesignConstants';

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
        size?: Size,
        folderLine?: boolean,
        option: TreeItem,
        depth?: number,
    }>(),
    {
        size: 'normal',
        folderLine: true,
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

relative-offset-small = padding-extend-small + (content-size-small / 2)
relative-offset-normal = padding-extend-normal + (content-size-normal / 2)
relative-offset-large = padding-extend-large + (content-size-large / 2)

.__sun-design-tree-container__
    display: flex
    flex-direction: column
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
    padding-left: calc(var(--Depth) * var(--Indent)) !important

.__sun-design-tree-arrow__
    .__sun-design-tree-container__[data-size="small"] > .__sun-design-button__ > &
        margin-left: padding-extend-small
    .__sun-design-tree-container__[data-size="normal"] > .__sun-design-button__ > &
        margin-left: padding-extend-normal
    .__sun-design-tree-container__[data-size="large"] > .__sun-design-button__ > &
        margin-left: padding-extend-large

.__sun-design-tree-relation__
    position: relative
    &.no-folder-line::after
        display: none
    &::after
        content: ''
        position: absolute
        height: 100%
        border-left: border-width var(--border-color-normal) solid
        transform: translate(-50%, 0)
    &[data-size="small"]::after
        left: 'calc((var(--Depth) - 1) * var(--Indent) + %s)' % (relative-offset-small)
    &[data-size="normal"]::after
        left: 'calc((var(--Depth) - 1) * var(--Indent) + %s)' % (relative-offset-normal)
    &[data-size="large"]::after
        left: 'calc((var(--Depth) - 1) * var(--Indent) + %s)' % (relative-offset-large)

// .__sun-design-tree-item-drop-indicator__
//     position absolute
//     bottom: - (panel-padding / 2)
//     width: 100%
//     border-top: border-width var(--color-active) solid
//     transform: translate(0, 50%)

</style>