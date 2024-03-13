<template>
    <SunPanel vertical container
        style="width: 70px; aspect-ratio: 1; padding: 4px; overflow: visible; position: relative;"
        @mousedown.self="onWheelMouseDown">
        <div ref="wheel_ref" style="width: 100%; height: 100%; position: relative; pointer-events: none;">
            <div class="__sun-design-angleedit-content-tick__ th0"></div>
            <div class="__sun-design-angleedit-content-tick__ th1"></div>
            <div class="__sun-design-angleedit-content-tick__ th2"></div>
            <div class="__sun-design-angleedit-content-tick__ th3"></div>
            <div class="__sun-design-angleedit-content-tick__ th4"></div>
            <div class="__sun-design-angleedit-content-tick__ th5"></div>
            <div class="__sun-design-angleedit-content-tick__ th6"></div>
            <div class="__sun-design-angleedit-content-tick__ th7"></div>
            <div
                style="position: absolute; inset: 8px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <SunButtonLike squared flat no-hover-color no-pressed-color>
                    {{ deg.toFixed(0) }}
                </SunButtonLike>
            </div>
        </div>
        <button class="__sun-design__ colored bordered __sun-design-angleedit-content-nob__"
            :style="{ '--Degree': `${deg}deg` }" @mousedown="onNobMouseDown" @keydown.arrow-left="deg -= 1"
            @keydown.arrow-right="deg += 1" @keydown.arrow-up="deg -= 1" @keydown.arrow-down="deg += 1"></button>
    </SunPanel>
</template>

<script setup lang="ts">

import SunPanel from '../panel/SunPanel.vue';
import SunPanelContainer from '../panel/SunPanelContainer.vue';
import SunPanelSeparator from '../panel/SunPanelSeparator.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import SunControlGroup from '../controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '../controlgroup/SunControlGroupRow.vue';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import SunNumberEdit from '../numberedit/SunNumberEdit.vue';
import { computed, onBeforeUnmount, ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        disabled?: boolean,
        // modelValue: ColorData,
        // modelModifiers?: Record<string, boolean>,
    }>(),
    {
        disabled: false,
    }
);

const _deg = ref(0);
const deg = computed({
    get: () => _deg.value,
    set: (v) => {
        const _v = (v < 0 ? v + 360 : v) % 360;
        if (_v === 0) {
            if (v >= 360) {
                _deg.value = 360;
            }
            else {
                _deg.value = 0;
            }
        }
        else {
            _deg.value = _v;
        }
    }
});

//#region wheel
const wheel_ref = ref<HTMLDivElement | null>(null);
let last_wheel_pos_x = 0, last_wheel_pos_y = 0;
function onNobMouseDown(evt: MouseEvent) {
    if (props.disabled || wheel_ref.value === null) return;
    const wheel_rect = wheel_ref.value.getBoundingClientRect();
    last_wheel_pos_x = wheel_rect.x + wheel_rect.width / 2;
    last_wheel_pos_y = wheel_rect.y + wheel_rect.height / 2;
    window.addEventListener('mousemove', onNobMouseMove, { capture: true });
    window.addEventListener('mouseup', onNobMouseUp, { capture: true });
}
function onNobMouseMove(evt: MouseEvent) {
    const new_pos_x = evt.clientX - last_wheel_pos_x, new_pos_y = evt.clientY - last_wheel_pos_y;
    let _deg = Math.atan2(new_pos_y, new_pos_x) / Math.PI * 180;
    if (evt.shiftKey) {
        _deg = Math.round(_deg / 15) * 15;
    }
    deg.value = _deg;
}
function onNobMouseUp(evt: MouseEvent) {
    removeNobDraggingEvents();
}
function removeNobDraggingEvents() {
    window.removeEventListener('mousemove', onNobMouseMove, { capture: true });
    window.removeEventListener('mouseup', onNobMouseUp, { capture: true });
}
// wheel container
function onWheelMouseDown(evt: MouseEvent) {
    window.addEventListener('mousemove', onWheelMouseMove, { capture: true });
    window.addEventListener('mouseup', onWheelMouseUp, { capture: true });
}
async function onWheelMouseMove(evt: MouseEvent) {
    onWheelClick(evt);
    removeWheelEvents();
    onNobMouseDown(evt);
}
function onWheelMouseUp(evt: MouseEvent) {
    onWheelClick(evt);
    removeWheelEvents();
}
function onWheelClick(evt: MouseEvent) {
    if (props.disabled || wheel_ref.value === null) return;
    const wheel_rect = wheel_ref.value.getBoundingClientRect();
    const wheel_center_x = wheel_rect.x + wheel_rect.width / 2, wheel_center_y = wheel_rect.y + wheel_rect.height / 2;
    const new_pos_x = evt.clientX - wheel_center_x, new_pos_y = evt.clientY - wheel_center_y;
    let _deg = Math.atan2(new_pos_y, new_pos_x) / Math.PI * 180;
    if (evt.shiftKey) {
        _deg = Math.round(_deg / 15) * 15;
    }
    deg.value = _deg;
}
function removeWheelEvents() {
    window.removeEventListener('mousemove', onWheelMouseMove, { capture: true });
    window.removeEventListener('mouseup', onWheelMouseUp, { capture: true });
}
//#endregion

onBeforeUnmount(() => {
    removeNobDraggingEvents();
    removeWheelEvents();
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

wheel-width = - border-width / 2
nob-size = 16px
nob-width = 3px

.__sun-design-angleedit-content-nob__
    --Degree: 45deg
    box-sizing: border-box
    width: nob-size
    padding: 0
    margin: 0
    aspect-ratio: 1
    position: absolute
    border-radius: 50%
    left: 'calc(50% + (100% - %s) / 2 * cos(var(--Degree)) - %s)' % (wheel-width nob-size / 2)
    top: 'calc(50% + (100% - %s) / 2 * sin(var(--Degree)) - %s)' % (wheel-width nob-size / 2)
    border: solid-border
    background-color: var(--attachment-color)
    outline: none
    box-shadow: panel-drop-shadow

.__sun-design-angleedit-content-tick__
    position: absolute
    width: border-width
    background-color: var(--border-color-normal)
    height: 50%
    left: 'calc(50% - %s)' % (border-width / 2)
    transform-origin: 50% 100%
    &.th0
        transform: rotate(0deg)
    &.th1
        transform: rotate(45deg)
    &.th2
        transform: rotate(90deg)
    &.th3
        transform: rotate(135deg)
    &.th4
        transform: rotate(180deg)
    &.th5
        transform: rotate(225deg)
    &.th6
        transform: rotate(270deg)
    &.th7
        transform: rotate(315deg)
</style>