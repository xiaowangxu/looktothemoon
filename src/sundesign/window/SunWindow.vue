<template>
    <SunPopup ref="popup_ref" :teleport-target="WindowTarget" :style="{ 'z-index': layer }" :rect="popup_rect"
        :stop-events="exclusive" @focusin="focus">
        <SunPanel style="width: 100%; height: 100%;" vertical>
            <template v-if="!borderless">
                <SunPanelContainer gap
                    style="align-items: center; padding-right: 10px; background-color: var(--color-normal);"
                    @mousedown="onDragMouseDown('drag', $event)">
                    <SunButtonLike no-vertical-padding no-hover-color no-pressed-color flat
                        style="flex: 1; min-height: unset;">
                        <Globe />
                        <SunButtonLabel style="margin-right: auto;">测试窗体 </SunButtonLabel>
                    </SunButtonLike>
                    <SunButton size="small" squared>
                        <Maximize />
                    </SunButton>
                    <SunButton size="small" squared>
                        <X />
                    </SunButton>
                </SunPanelContainer>
                <SunPanelSeparator />
            </template>
            <slot :drag="drag">
                <SunPanelResizeContainer style="flex: 1;" :initial-percentage="0.2">
                    <template #first>
                        <SunScrollContainer style="width: 100%; height: 100%;" content-style="width: 100%;">
                            <SunPanelContainer vertical gap>
                                <template v-for="s in 3">
                                    <SunLabel size="large" :no-horizontal-padding="false" squared
                                        style="font-weight: bold;">
                                        类型区域{{ s }}</SunLabel>
                                    <SunButton v-for="i in 10" flat>
                                        <AppWindow />
                                        <SunButtonLabel style="margin-right: auto;">按钮 {{ i }}</SunButtonLabel>
                                    </SunButton>
                                </template>
                                <SunColorPicker></SunColorPicker>
                            </SunPanelContainer>
                        </SunScrollContainer>
                    </template>
                    <template #second>
                        <SunPanelResizeContainer vertical style="width: 100%; height: 100%;">
                        </SunPanelResizeContainer>
                    </template>
                </SunPanelResizeContainer>
            </slot>
        </SunPanel>
        <div v-show="resizeable" class="__sun-design-window-resize-r__" @mousedown="onDragMouseDown('right', $event)" />
        <div v-show="resizeable" class="__sun-design-window-resize-l__" @mousedown="onDragMouseDown('left', $event)" />
        <div v-show="resizeable" class="__sun-design-window-resize-t__" @mousedown="onDragMouseDown('top', $event)" />
        <div v-show="resizeable" class="__sun-design-window-resize-b__" @mousedown="onDragMouseDown('bottom', $event)" />
        <div v-show="resizeable" class="__sun-design-window-resize-tr__"
            @mousedown="onDragMouseDown('top-right', $event)" />
        <div v-show="resizeable" class="__sun-design-window-resize-tl__" @mousedown="onDragMouseDown('top-left', $event)" />
        <div v-show="resizeable" class="__sun-design-window-resize-br__"
            @mousedown="onDragMouseDown('bottom-right', $event)" />
        <div v-show="resizeable" class="__sun-design-window-resize-bl__"
            @mousedown="onDragMouseDown('bottom-left', $event)" />
    </SunPopup>
</template>

<script setup lang="ts">

import SunPopup from '../popup/SunPopup.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonLabel from '../button/SunButtonLabel.vue';
import SunLabel from '../label/SunLabel.vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import SunPanel from '../panel/SunPanel.vue';
import SunPanelContainer from '../panel/SunPanelContainer.vue';
import SunPanelSeparator from '../panel/SunPanelSeparator.vue';
import SunPanelResizeContainer from '../panel/SunPanelResizeContainer.vue';
import SunScrollContainer from '../scrollcontainer/SunScrollContainer.vue';
import SunColorPicker from '../colorpicker/SunColorPicker.vue';
import { X, AppWindow, Minimize, Maximize, Globe } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref } from 'vue';
import { WindowTarget, addWindow, focusWindow, removeWindow } from './SunWindowConstants';

// props
const props = withDefaults(
    defineProps<{
        exclusive?: boolean,
        borderless?: boolean,
        resizeable?: boolean,
    }>(),
    {
        exclusive: false,
        borderless: false,
        resizeable: true,
    }
);

// slots
defineSlots<{
    default(props: { drag: (evt: MouseEvent) => void }): void,
}>();

// datas
const popup_ref = ref<InstanceType<typeof SunPopup> | undefined>();
const popup_x = ref(100);
const popup_y = ref(100);
const popup_width = ref(300);
const popup_height = ref(400);
const popup_rect = computed(() => ({ x: popup_x.value, y: popup_y.value, height: popup_height.value, width: popup_width.value }));
let popup_last_x = 0;
let popup_last_y = 0;
let popup_last_width = 0;
let popup_last_height = 0;
let mouse_last_x = 0;
let mouse_last_y = 0;
let drag_type = 'none';
const { id, layer } = addWindow();

// container
function drag(evt: MouseEvent) {
    onDragMouseDown('drag', evt);
}
function onDragMouseDown(type: string, evt: MouseEvent) {
    mouse_last_x = evt.clientX;
    mouse_last_y = evt.clientY;
    drag_type = type;
    popup_last_x = popup_x.value;
    popup_last_y = popup_y.value;
    popup_last_width = popup_width.value;
    popup_last_height = popup_height.value;
    window.addEventListener('mousemove', onDragMouseMove, { capture: true });
    window.addEventListener('mouseup', onDragMouseUp, { capture: true });
    focus();
}
function adjustLeft(mouse_delta_x: number, mouse_delta_y: number) {
    const width = Math.max(100, popup_last_width - mouse_delta_x);
    const right = popup_last_x + popup_last_width;
    popup_width.value = width;
    popup_x.value = right - width;
}
function adjustRight(mouse_delta_x: number, mouse_delta_y: number) {
    popup_width.value = Math.max(100, popup_last_width + mouse_delta_x);
}
function adjustTop(mouse_delta_x: number, mouse_delta_y: number) {
    const height = Math.max(100, popup_last_height - mouse_delta_y);
    const right = popup_last_y + popup_last_height;
    popup_height.value = height;
    popup_y.value = right - height;
}
function adjustBottom(mouse_delta_x: number, mouse_delta_y: number) {
    popup_height.value = Math.max(100, popup_last_height + mouse_delta_y);
}
function onDragMouseMove(evt: MouseEvent) {
    const mouse_delta_x = evt.clientX - mouse_last_x;
    const mouse_delta_y = evt.clientY - mouse_last_y;
    switch (drag_type) {
        case 'drag': {
            popup_x.value = popup_last_x + mouse_delta_x;
            popup_y.value = popup_last_y + mouse_delta_y;
            break;
        }
        case 'right': {
            adjustRight(mouse_delta_x, mouse_delta_y);
            break;
        }
        case 'left': {
            adjustLeft(mouse_delta_x, mouse_delta_y);
            break;
        }
        case 'bottom': {
            adjustBottom(mouse_delta_x, mouse_delta_y);
            break;
        }
        case 'top': {
            adjustTop(mouse_delta_x, mouse_delta_y);
            break;
        }
        case 'top-right': {
            adjustTop(mouse_delta_x, mouse_delta_y);
            adjustRight(mouse_delta_x, mouse_delta_y);
            break;
        }
        case 'bottom-right': {
            adjustBottom(mouse_delta_x, mouse_delta_y);
            adjustRight(mouse_delta_x, mouse_delta_y);
            break;
        }
        case 'top-left': {
            adjustTop(mouse_delta_x, mouse_delta_y);
            adjustLeft(mouse_delta_x, mouse_delta_y);
            break;
        }
        case 'bottom-left': {
            adjustBottom(mouse_delta_x, mouse_delta_y);
            adjustLeft(mouse_delta_x, mouse_delta_y);
            break;
        }
    }
}
function onDragMouseUp(evt: MouseEvent) {
    removeDraggingEvents();
}
function focus() {
    focusWindow(id);
}
function removeDraggingEvents() {
    window.removeEventListener('mousemove', onDragMouseMove, { capture: true });
    window.removeEventListener('mouseup', onDragMouseUp, { capture: true });
}

onBeforeUnmount(() => {
    removeDraggingEvents();
    removeWindow(id);
});

</script>

<style lang="stylus">

resize-size = 6px

.__sun-design-window-resize-r__
    position: absolute
    top: 0
    bottom: 0
    right: - (resize-size / 2)
    width: resize-size
    cursor: e-resize
    // background-color: rgba(255, 0, 0, 0.1)
    pointer-events: initial

.__sun-design-window-resize-l__
    position: absolute
    top: 0
    bottom: 0
    left: - (resize-size / 2)
    width: resize-size
    cursor: e-resize
    // background-color: rgba(255, 0, 0, 0.1)
    pointer-events: initial

.__sun-design-window-resize-t__
    position: absolute
    top: - (resize-size / 2)
    left: 0
    right: 0
    height: resize-size
    cursor: n-resize
    // background-color: rgba(255, 0, 0, 0.1)
    pointer-events: initial

.__sun-design-window-resize-b__
    position: absolute
    bottom: - (resize-size / 2)
    left: 0
    right: 0
    height: resize-size
    cursor: n-resize
    // background-color: rgba(255, 0, 0, 0.1)
    pointer-events: initial

.__sun-design-window-resize-tr__
    position: absolute
    right: - (resize-size / 2)
    top: - (resize-size / 2)
    width: resize-size * 1.6
    height: resize-size * 1.6
    cursor: ne-resize
    // background-color: rgba(0, 255, 0, 0.1)
    pointer-events: initial

.__sun-design-window-resize-tl__
    position: absolute
    left: - (resize-size / 2)
    top: - (resize-size / 2)
    width: resize-size * 1.6
    height: resize-size * 1.6
    cursor: nw-resize
    // background-color: rgba(0, 255, 0, 0.1)
    pointer-events: initial

.__sun-design-window-resize-bl__
    position: absolute
    left: - (resize-size / 2)
    bottom: - (resize-size / 2)
    width: resize-size * 1.6
    height: resize-size * 1.6
    cursor: sw-resize
    // background-color: rgba(0, 255, 0, 0.1)
    pointer-events: initial

.__sun-design-window-resize-br__
    position: absolute
    right: - (resize-size / 2)
    bottom: - (resize-size / 2)
    width: resize-size * 1.6
    height: resize-size * 1.6
    cursor: se-resize
    // background-color: rgba(0, 255, 0, 0.1)
    pointer-events: initial

</style>