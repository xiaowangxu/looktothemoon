<template>
    <div ref="div_ref" class="__sun-design__ __sun-design-panel__"
        :class="{ vertical, 'not-container': !container, 'drop-shadow': dropShadow, 'panel-bordered': !container }"
        :data-size="size">
        <div v-if="trapFocus && !container" ref="div_focus_top_ref" class="__sun-design-panel-trapfocus__" tabindex="0"
            @focus="onTrapFocusTopFocused" @keydown.tab.shift.prevent="focusLast">
        </div>
        <slot />
        <div v-if="trapFocus && !container" ref="div_focus_bottom_ref" class="__sun-design-panel-trapfocus__" tabindex="0"
            style="left: 50%;" @focus="onTrapFocusBottomFocused"></div>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size, getFocusables, TrapFocusOutEvent } from '../SunDesignConstants';
import { onMounted, ref } from 'vue';
import { div } from 'three/examples/jsm/nodes/Nodes.js';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        vertical?: boolean,
        dropShadow?: boolean,
        container?: boolean,
        trapFocus?: boolean,
    }>(),
    {
        size: 'normal',
        vertical: false,
        dropShadow: true,
        container: false,
        trapFocus: true,
    }
);

// emits
const emits = defineEmits<{
    (event: 'trapFocusOut', evt: TrapFocusOutEvent): void,
}>();

// datas
const div_ref = ref<HTMLDivElement | null>(null);
const div_focus_top_ref = ref<HTMLDivElement | null>(null);
const div_focus_bottom_ref = ref<HTMLDivElement | null>(null);

onMounted(() => {
    if (!props.container) {
        focusTop();
    }
});

let ignore_focus_once = false;
function onTrapFocusTopFocused(evt: FocusEvent) {
    if (ignore_focus_once) {
        ignore_focus_once = false;
        return;
    }
    if (evt.relatedTarget === div_focus_bottom_ref.value) {
        focusFirst();
    }
    else {
        focusLast();
    }
}
function onTrapFocusBottomFocused(evt: FocusEvent) {
    if (ignore_focus_once) {
        ignore_focus_once = false;
        return;
    }
    if (evt.relatedTarget === div_focus_top_ref.value) {
        focusLast();
    }
    else {
        const evt = new TrapFocusOutEvent();
        emits('trapFocusOut', evt);
        if (evt.defaultPrevented) return;
        focusFirst();
    }
}
function focusTop() {
    ignore_focus_once = true;
    div_focus_top_ref.value?.focus();
}
function focusFirst() {
    if (div_ref.value === null) return;
    const focusables = getFocusables(div_ref.value);
    if (focusables.length === 0) {
        emits('trapFocusOut', new TrapFocusOutEvent());
    }
    else {
        (focusables.item(0) as HTMLElement | undefined)?.focus?.();
    }
}
function focusLast() {
    if (div_ref.value === null) return;
    const focusables = getFocusables(div_ref.value);
    if (focusables.length === 0) {
        emits('trapFocusOut', new TrapFocusOutEvent());
    }
    else {
        (focusables.item(focusables.length - 1) as HTMLElement | undefined)?.focus?.();
    }
}

// exposes
defineExpose({
    div: div_ref,
    focusTop,
    focusFirst,
    focusLast,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-panel-trapfocus__
    z-index: 1
    width: 0px
    height: 0px
    position: absolute
    // background-color: red
    pointer-events: none

    &:focus
        // outline: green 2px solid

.__sun-design__.__sun-design-panel__
    display: flex
    gap: 0
    flex-direction: row
    overflow: hidden
    position: relative
    // pointer-events: initial

    &.panel-bordered
        border: panel-border

    &.not-container
        background-color: var(--panel-color)
        &.drop-shadow
            box-shadow: panel-drop-shadow

        &[data-size="small"]
            border-radius: panel-border-radius-small

        &[data-size="normal"]
            border-radius: panel-border-radius-normal

        &[data-size="large"]
            border-radius: panel-border-radius-large
    
    &.vertical
        flex-direction: column

</style>