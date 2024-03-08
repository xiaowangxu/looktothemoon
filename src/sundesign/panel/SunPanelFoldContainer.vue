<template>
    <SunButtonLike class="__sun-design-panel-fold-container-button__" :size="size"
        :class="{ append: $slots.append !== undefined, unfolded: !folded, 'hover-show': hoverShowAppend }" no-hover-color
        no-pressed-color flat>
        <SunButton class="__sun-design-panel-fold-container-fold-button__ no-hover-color no-pressed-color" :size="size" flat
            align="start" style="flex: 1;" @click="folded = !folded">
            <ChevronRight v-if="folded" />
            <ChevronDown v-else />
            <slot name="item">
                <SunButtonItem :label="label" />
            </slot>
        </SunButton>
        <div v-show="hoverShowAppend || !folded" v-if="$slots.append !== undefined"
            class="__sun-design-panel-fold-container-append__" :class="{ 'hover-show': hoverShowAppend && folded }">
            <slot name="append" />
        </div>
    </SunButtonLike>
    <div class="__sun-design-panel-fold-container-content-container__"
        :class="{ unfolded: !folded, resizable }" v-bind="$attrs">
        <slot />
    </div>
</template>

<script setup lang="ts">

import { computed, getCurrentInstance, inject, onBeforeMount, ref, watch } from 'vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import type { Size } from '../SunDesignConstants';
import { SunPanelFoldContainerGroupInjection } from './SunPanelFoldContainerGroupConstants';

const panel_fold_container_group_injection = inject(SunPanelFoldContainerGroupInjection, undefined);

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        label?: string,
        initialFold?: boolean,
        hoverShowAppend?: boolean,
        resizable?: boolean,
    }>(),
    {
        size: 'normal',
        label: '',
        initialFold: false,
        hoverShowAppend: false,
        resizable: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'opened'): void;
    (event: 'closed'): void;
    (event: 'toggle', folded: boolean): void;
}>();

// datas
const uid = getCurrentInstance()!.uid;
const _folded = ref(props.initialFold);
onBeforeMount(() => {
    if (!props.initialFold && panel_fold_container_group_injection !== undefined) {
        panel_fold_container_group_injection.open(uid);
    }
});
const folded = computed({
    get: () => {
        if (panel_fold_container_group_injection === undefined) {
            return _folded.value;
        }
        else {
            return panel_fold_container_group_injection.value.value !== uid;
        }
    },
    set: (v) => {
        if (panel_fold_container_group_injection === undefined) {
            _folded.value = v;
        }
        else {
            if (v) {
                panel_fold_container_group_injection.close(uid);
            }
            else {
                panel_fold_container_group_injection.open(uid);
            }
        }
    }
});
watch(folded, folded => {
    if (folded) emits('closed');
    else emits('opened');
    emits('toggle', folded);
}, { flush: 'post' });

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-panel-fold-container-button__
    width: 100%
    justify-content: flex-start !important
    border-radius: 0px !important
    padding-top: 0px !important
    padding-bottom: 0px !important
    padding-left : 0px !important
    padding-right : 0px !important

    &.append.unfolded
        padding-right : padding-extend-normal !important
    
    &.append.hover-show:not(.unfolded):hover
        padding-right : padding-extend-normal !important

    &:has(> .__sun-design-panel-fold-container-fold-button__:hover)
        background-color: var(--color-normal) !important

.__sun-design-panel-fold-container-content-container__
    width: 100%
    flex: 1
    overflow: hidden
    display: none

    &.resizable
        resize: vertical
        flex-basis: auto

    &.unfolded
        display: block
        // border-top: solid-border

.__sun-design-panel-fold-container-append__
    gap: panel-padding
    flex-direction: row
    flex-wrap: nowrap
    display: flex
    &.hover-show
        display: none

    .__sun-design-panel-fold-container-button__:hover > &.hover-show
        display: flex

</style>