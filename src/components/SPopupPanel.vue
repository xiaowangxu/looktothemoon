<template>
    <SPopup :visible="visible" :rect="rect" :teleportDisabled="teleportDisabled">
        <SPanel ref="spanel_ref" class="__s_popuppanel_panel__" :color="color"
            :style="{ width, height, ...($attrs.style ?? {}) }" @mouseenter="on_PanelMouseEntered"
            @mouseleave="on_PanelMouseLeaved" v-on-click-outside="on_ClickOutsideHandler">
            <SScrollContainer width="100%" maxWidth="100%">
                <slot :rect="rect" />
            </SScrollContainer>
        </SPanel>
    </SPopup>
</template>

<script setup lang="ts">

import SPopup from '@/components/SPopup.vue';
import SPanel from '@/components/SPanel.vue';
import SScrollContainer from '@/components/SScrollContainer.vue';
import { type Rect } from './SConst';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { vOnClickOutside } from '@vueuse/components';

// props
const props = withDefaults(
    defineProps<{
        rect: Rect | undefined,
        teleportDisabled?: boolean,
        color?: string,
    }>(),
    {
        teleportDisabled: false,
    }
);

// slots
defineSlots<{
    default(props: { rect: Rect | undefined }): void,
}>();

// emits
const emits = defineEmits<{
    opened: [],
    closed: [],
    mouseenter: [event: Event],
    mouseleave: [event: Event],
    clickoutside: [event: Event],
}>();

// datas
const spanel_ref = ref<InstanceType<typeof SPanel> | null>(null);
const visible = computed(() => props.rect !== undefined);
watch(visible, (v) => {
    if (v) emits('opened');
    else emits('closed');
});
onBeforeUnmount(() => emits('closed'));
const width = computed(() => props.rect === undefined ? undefined : `${props.rect.width}px`);
const height = computed(() => props.rect === undefined ? undefined : `${props.rect.height}px`);

// methods
function on_PanelMouseEntered(event: Event) {
    emits('mouseenter', event);
}
function on_PanelMouseLeaved(event: Event) {
    emits('mouseleave', event);
}
function on_ClickOutsideHandler(event: Event) {
    emits('clickoutside', event);
};

// exposes
defineExpose({
    panelComponent: spanel_ref,
});

</script>

<style>
.__s_popuppanel_panel__ {
    width: min-content;
    height: min-content;
    pointer-events: all;
    padding: 0;
    overflow: hidden;
    border-radius: var(--NormalRadius);
    overflow: hidden;
}
</style>