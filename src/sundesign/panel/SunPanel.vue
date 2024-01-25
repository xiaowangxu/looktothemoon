<template>
    <div ref="div_ref" class="__sun-design__ __sun-design-panel__"
        :class="{ vertical, 'not-container': !container, 'drop-shadow': dropShadow, bordered: !container }"
        :data-size="size">
        <div v-if="!container" ref="div_focus_top_ref" class="test" tabindex="0"
            style="width: 100%; height: 0px; position: absolute; top: 0; background-color: aqua;">
        </div>
        <slot />
        <div v-if="!container" class="test" tabindex="0"
            style="width: 100%; height: 0px; position: absolute; bottom: 0; background-color: red;"></div>
    </div>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size } from '../SunDesignConstants';
import { onMounted, ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        vertical?: boolean,
        dropShadow?: boolean,
        container?: boolean,
    }>(),
    {
        size: 'normal',
        vertical: false,
        dropShadow: true,
        container: false,
    }
);

// datas
const div_ref = ref<HTMLDivElement | null>(null);
const div_focus_top_ref = ref<HTMLDivElement | null>(null);

onMounted(() => {
    if (!props.container) {
        console.log(">>>>>>> focus");
        // div_focus_top_ref.value?.focus();
    }
});

// exposes
defineExpose({
    div: div_ref,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.test:focus 
    z-index: 1
    border: green 2px solid
    > .__sun-design__.__sun-design-panel__
        outline: red 2px solid

.__sun-design__.__sun-design-panel__
    display: flex
    gap: 0
    flex-direction: row
    overflow: hidden
    background-color: var(--panel-color)
    position: relative

    &.not-container
        &.drop-shadow
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.1)

        &[data-size="small"]
            border-radius: panel-border-radius-small

        &[data-size="normal"]
            border-radius: panel-border-radius-normal

        &[data-size="large"]
            border-radius: panel-border-radius-large
    
    &.vertical
        flex-direction: column

</style>