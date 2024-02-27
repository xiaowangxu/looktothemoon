<template>
    <SunButtonPopup ref="buttonpopup_ref" class="__sun-design-color-picker-button__" :style="{ '--Color': color_str }"
        v-bind="$attrs" :size="size" popup-size="normal" :flat="flat" :borderMask="borderMask" :squared="squared"
        :disabled="disabled" drop-shadow mode="instance" vertical
        content-style="width: 100%; min-width: 180px; max-width: 180px;" :getPopupRect="getPopupRect" scrollable-indicators
        @opened="onOpened" @closed="onClosed" :title="color_str">
        <template #popup>

            <!-- Previewer -->
            <SunPanelContainer gap style="flex-shrink: 0;">
                <SunButton squared @click="onEyeDropper">
                    <Pipette />
                </SunButton>
                <SunControlGroup style="flex: 1;">
                    <SunControlGroupRow>
                        <SunColorButton style="flex: 1;" :color="inner_color" />
                        <SunColorButton style="flex: 1;" :color="last_color" />
                    </SunControlGroupRow>
                </SunControlGroup>
                <SunButton squared @click="resetLastColor" :disabled="!color_changed">
                    <RotateCcw />
                </SunButton>
            </SunPanelContainer>
            <SunPanelSeparator />

            <!-- Picker -->
            <template v-if="allowInputWheel">
                <SunPanelContainer gap vertical style="min-height: 120px; aspect-ratio: 1; flex-shrink: 0;">
                    <SunPanelContainer gap no-padding style="flex: 1;">
                        <div ref="wheel_ref" class="__sun-design-color-picker-wheel__"
                            :style="{ '--HueDegree': `${shade_hue}deg`, '--ShadeX': `${shade_x * 100}%`, '--ShadeY': `${shade_y * 100}%`, '--PlainColorEdit': plain_color_edit_str }"
                            @mousedown.self="onWheelMouseDown">
                            <div class="__sun-design-color-picker-wheel-cover__" />
                            <button class="__sun-design-color-picker-hue-nob__" @mousedown="onHueNobMouseDown"
                                @keydown.arrow-left="shade_hue -= 1" @keydown.arrow-right="shade_hue += 1"
                                @keydown.arrow-up="shade_hue -= 1" @keydown.arrow-down="shade_hue += 1"></button>
                            <div ref="shade_ref" class="__sun-design-color-picker-field__" :data-size="size"
                                @mousedown.self="onShadeMouseDown">
                                <button class="__sun-design-color-picker-shade-nob__" @mousedown="onShadeNobMouseDown"
                                    @keydown.arrow-left="shade_x = Math.max(0, shade_x - 0.01)"
                                    @keydown.arrow-right="shade_x = Math.min(1, shade_x + 0.01)"
                                    @keydown.arrow-up="shade_y = Math.max(0, shade_y - 0.01)"
                                    @keydown.arrow-down="shade_y = Math.min(1, shade_y + 0.01)"></button>
                            </div>
                        </div>
                    </SunPanelContainer>
                </SunPanelContainer>
                <SunPanelSeparator />
            </template>

            <!-- Input -->
            <SunPanelContainer gap style="flex-shrink: 0;" vertical>
                <SunPanelContainer gap no-padding style="flex: 1;">
                    <SunPanelContainer gap no-padding vertical style="flex: 1;">
                        <SunControlGroup>
                            <SunControlGroupRow>
                                <SunNumberEdit v-model="input_r" v-bind="edit_props_r" :drag-factor="2" style="flex: 1;">
                                    <template #suffix> {{ edit_label_r }} </template>
                                </SunNumberEdit>
                            </SunControlGroupRow>
                            <SunControlGroupRow>
                                <SunNumberEdit v-model="input_g" v-bind="edit_props_g" :drag-factor="2" style="flex: 1;">
                                    <template #suffix> {{ edit_label_g }} </template>
                                </SunNumberEdit>
                            </SunControlGroupRow>
                            <SunControlGroupRow>
                                <SunNumberEdit v-model="input_b" v-bind="edit_props_b" :drag-factor="2" style="flex: 1;">
                                    <template #suffix> {{ edit_label_b }} </template>
                                </SunNumberEdit>
                            </SunControlGroupRow>
                        </SunControlGroup>
                        <SunNumberEdit v-if="allowInputAlpha" v-model="alpha" :min="0" :max="255" :step="1"
                            :value-snap-gap="1" :drag-factor="2">
                            <template #suffix> {{ edit_label_a }} </template>
                        </SunNumberEdit>
                    </SunPanelContainer>
                    <SunPanelContainer gap no-padding vertical>
                        <SunControlGroup>
                            <SunControlGroupRow>
                                <SunSelect icon-only squared v-model="edit_format" :options="edit_formats">
                                    <template #closed>
                                        <Palette />
                                    </template>
                                    <template #opened>
                                        <Palette />
                                    </template>
                                </SunSelect>
                            </SunControlGroupRow>
                        </SunControlGroup>
                    </SunPanelContainer>
                </SunPanelContainer>
                <SunControlGroup style="flex: 1;">
                    <SunControlGroupRow>
                        <SunLineEdit v-model.lazy="color_edit_str" class="__sun-design-color-picker-lineedit__"
                            style="flex: 1;" />
                        <SunSelect style="width: min-content; align-self: flex-end;" icon-only squared v-model="code_format"
                            :options="[[{ label: 'Hex', uid: 0 }, { label: 'Color String', uid: 1 }]]">
                            <template #closed>
                                <Hash />
                            </template>
                            <template #opened>
                                <Hash />
                            </template>
                        </SunSelect>
                    </SunControlGroupRow>
                </SunControlGroup>
            </SunPanelContainer>
            <SunPanelSeparator />

            <!-- Library -->
            <template v-if="allowInputLibrary">
                <SunPanelFoldContainer label="最近使用" v-memo="[recent_colors]" :initial-fold="recent_folded"
                    @toggle="(folded) => { recent_folded = folded; $nextTick(() => buttonpopup_ref?.refreshPopupContentMinSize()); }">
                    <SunPanelContainer v-show="recent_colors.length > 0" gap style="flex-wrap: wrap;">
                        <SunColorButton v-for="color in recent_colors" :color="color" size="small" squared
                            @click="setRGBA(color[0], color[1], color[2], color[3])" />
                    </SunPanelContainer>
                </SunPanelFoldContainer>
            </template>
        </template>
    </SunButtonPopup>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunPanelFoldContainer from '../panel/SunPanelFoldContainer.vue';
import SunButtonPopup from '../buttonpopup/SunButtonPopup.vue';
import SunButton from '../button/SunButton.vue';
import SunSelect from '../select/SunSelect.vue';
import SunPanelContainer from '../panel/SunPanelContainer.vue';
import SunPanelSeparator from '../panel/SunPanelSeparator.vue';
import SunControlGroup from '../controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '../controlgroup/SunControlGroupRow.vue';
import SunNumberEdit from '../numberedit/SunNumberEdit.vue';
import SunLineEdit from '../lineedit/SunLineEdit.vue';
import { RotateCcw, Pipette, Plus, Hash, Palette } from 'lucide-vue-next';
import { calcButtonPopupRect, type Rect, type BoxSize, type Size, type BorderMask, useInputModel } from '../SunDesignConstants';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useColorPickerData, type ColorData, type PlainColorData } from './SunColorPickerConstants';
import { useEyeDropper } from '@vueuse/core';
import SunColorButton from './SunColorButton.vue';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        borderMask?: BorderMask,
        squared?: boolean,
        disabled?: boolean,
        modelValue: ColorData,
        modelModifiers?: Record<string, boolean>,
        allowInputAlpha?: boolean,
        allowInputWheel?: boolean,
        allowInputLibrary?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        borderMask: 15,
        squared: false,
        disabled: false,
        allowInputAlpha: true,
        allowInputWheel: true,
        allowInputLibrary: true,
    }
);

function getPopupRect(buttonRect: Rect, contentMinSize: BoxSize, windowSize: BoxSize): Rect {
    return calcButtonPopupRect(buttonRect, contentMinSize, windowSize, buttonRect.width > contentMinSize.width ? 1 : 0, 0, undefined, undefined, false);
}

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', value: ColorData): void,
    (event: 'input', val: ColorData): void,
    (event: 'change', val: ColorData): void,
}>();

// datas
const buttonpopup_ref = ref<InstanceType<typeof SunButtonPopup> | undefined>();

const _shade_hue = ref(0);
const shade_hue = computed({ get: () => _shade_hue.value, set: (v) => _shade_hue.value = (v < 0 ? v + 360 : v) % 360 });  // hsb - h
const shade_x = ref(0); // hsb - s
const shade_y = ref(0); // hsb - b
const _alpha = ref(1);
const alpha = computed({ get: () => Math.round(_alpha.value * 255), set: (v) => _alpha.value = v / 255 });  // a
const inner_color = computed(() => {
    const h = shade_hue.value;
    const s = shade_x.value;
    const b = 1 - shade_y.value;
    return [hsb2rgb_f(5, h, s, b), hsb2rgb_f(3, h, s, b), hsb2rgb_f(1, h, s, b), _alpha.value] as ColorData;
});
function setRGBA(r: number, g: number, b: number, a?: number) {
    const [inner_color_r, inner_color_g, inner_color_b, inner_color_a] = inner_color.value;
    if (inner_color_r !== r || inner_color_g !== g || inner_color_b !== b) {
        const v = Math.max(r, g, b), n = v - Math.min(r, g, b);
        const h = n === 0 ? 0 : n && v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n;
        shade_hue.value = 60 * (h < 0 ? h + 6 : h);
        shade_x.value = v && (n / v);
        shade_y.value = 1 - v;
    }
    if (a !== undefined && inner_color_a !== a) {
        _alpha.value = a;
    }
}

const { value, setValueOnInput, setValueOnChange } = useInputModel(props, 'modelValue', 'modelModifiers', emits, { emitInput: 'input', emitChange: 'change' });
const color_str = computed(() => `#${toHex(value.value[0], 255)}${toHex(value.value[1], 255)}${toHex(value.value[2], 255)}${toHex(value.value[3], 255)}`);
watch(value, val => setRGBA(val[0], val[1], val[2], val[3]), { immediate: true });
watch(inner_color, color => setValueOnInput([...color]));
const last_color = ref<ColorData>([0, 0, 0, 0]);
const color_changed = computed(() => {
    const [r, g, b, a] = last_color.value;
    const [_r, _g, _b, _a] = inner_color.value;
    return r !== _r || g !== _g || b !== _b || a !== _a;
});
function onOpened() {
    last_color.value = [...value.value];
}
function onClosed() {
    const [r, g, b, a] = value.value;
    const [_r, _g, _b, _a] = inner_color.value;
    addRecentColor(inner_color.value);
    if (r !== _r || g !== _g || b !== _b || a !== _a) {
        setValueOnChange([...inner_color.value]);
    }
}
function resetLastColor() {
    const [r, g, b, a] = last_color.value;
    setRGBA(r, g, b, a);
}

function hsb2rgb_k(n: number, h: number) {
    return (n + h / 60) % 6;
}
function hsb2rgb_f(n: number, h: number, s: number, b: number): number {
    return b * (1 - s * Math.max(0, Math.min(hsb2rgb_k(n, h), 4 - hsb2rgb_k(n, h), 1)));
}
const color_edit = computed<PlainColorData>({
    get: () => {
        switch (edit_format.value) {
            case 'RGB':
                {
                    const h = shade_hue.value;
                    const s = shade_x.value;
                    const b = 1 - shade_y.value;
                    return [Math.round(hsb2rgb_f(5, h, s, b) * 255), Math.round(hsb2rgb_f(3, h, s, b) * 255), Math.round(hsb2rgb_f(1, h, s, b) * 255)] as PlainColorData;
                }
        }
        return [0, 0, 0] as PlainColorData;
    },
    set: ([r, g, b]: PlainColorData) => {
        switch (edit_format.value) {
            case 'RGB':
                {
                    setRGBA(r /= 255, g /= 255, b /= 255);
                    return;
                }
        }
    },
});

const input_r = computed({
    get: () => color_edit.value[0],
    set: (r) => { color_edit.value = [r, input_g.value, input_b.value] },
});
const input_g = computed({
    get: () => Math.round(color_edit.value[1]),
    set: (g) => { color_edit.value = [input_r.value, g, input_b.value] },
});
const input_b = computed({
    get: () => Math.round(color_edit.value[2]),
    set: (b) => { color_edit.value = [input_r.value, input_g.value, b] },
});

const {
    edit_formats, edit_format,
    edit_label_r, edit_label_g, edit_label_b, edit_label_a,
    edit_props_r, edit_props_g, edit_props_b,
    code_format,
    recent_colors, addRecentColor, recent_folded,
} = useColorPickerData();

function toHex(num: number, mult: number = 1) {
    return (Math.round(num * mult)).toString(16).padStart(2, '0').toUpperCase();
}

const plain_color_edit_str = computed(() => `#${toHex(inner_color.value[0], 255)}${toHex(inner_color.value[1], 255)}${toHex(inner_color.value[2], 255)}`);
const color_edit_str = computed({
    get: () => `#${toHex(inner_color.value[0], 255)}${toHex(inner_color.value[1], 255)}${toHex(inner_color.value[2], 255)}${inner_color.value[3] === 1 ? '' : toHex(inner_color.value[3], 255)}`,
    set: (str) => {

    },
});

function onEyeDropper() {
    useEyeDropper().open().then((res) => {
        if (res === undefined) return;
        const _r = res.sRGBHex.slice(1, 3);
        const _g = res.sRGBHex.slice(3, 5);
        const _b = res.sRGBHex.slice(5, 7);
        setRGBA(parseInt(_r, 16) / 255, parseInt(_g, 16) / 255, parseInt(_b, 16) / 255, 1);
    });
}

//#region wheel
const wheel_ref = ref<HTMLDivElement | null>(null);
let last_wheel_pos_x = 0, last_wheel_pos_y = 0;
function onHueNobMouseDown(evt: MouseEvent) {
    if (props.disabled || wheel_ref.value === null) return;
    const wheel_rect = wheel_ref.value.getBoundingClientRect();
    last_wheel_pos_x = wheel_rect.x + wheel_rect.width / 2;
    last_wheel_pos_y = wheel_rect.y + wheel_rect.height / 2;
    window.addEventListener('mousemove', onHueNobMouseMove, { capture: true });
    window.addEventListener('mouseup', onHueNobMouseUp, { capture: true });
}
function onHueNobMouseMove(evt: MouseEvent) {
    const new_pos_x = evt.clientX - last_wheel_pos_x, new_pos_y = evt.clientY - last_wheel_pos_y;
    const deg = Math.atan2(new_pos_y, new_pos_x) / Math.PI * 180;
    shade_hue.value = deg;
}
function onHueNobMouseUp(evt: MouseEvent) {
    removeHueNobDraggingEvents();
}
function removeHueNobDraggingEvents() {
    window.removeEventListener('mousemove', onHueNobMouseMove, { capture: true });
    window.removeEventListener('mouseup', onHueNobMouseUp, { capture: true });
}
// wheel container
function onWheelMouseDown(evt: MouseEvent) {
    window.addEventListener('mousemove', onWheelMouseMove, { capture: true });
    window.addEventListener('mouseup', onWheelMouseUp, { capture: true });
}
async function onWheelMouseMove(evt: MouseEvent) {
    onWheelClick(evt);
    removeWheelEvents();
    onHueNobMouseDown(evt);
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
    const deg = Math.atan2(new_pos_y, new_pos_x) / Math.PI * 180;
    shade_hue.value = deg;
}
function removeWheelEvents() {
    window.removeEventListener('mousemove', onWheelMouseMove, { capture: true });
    window.removeEventListener('mouseup', onWheelMouseUp, { capture: true });
}
//#endregion

//#region shade
const shade_ref = ref<HTMLDivElement | null>(null);
let last_shade_width = 0, last_shade_height = 0;
let last_shade_x = 0, last_shade_y = 0;
function onShadeNobMouseDown(evt: MouseEvent) {
    if (props.disabled || shade_ref.value === null) return;
    const shade_rect = shade_ref.value.getBoundingClientRect();
    last_shade_x = shade_rect.x;
    last_shade_y = shade_rect.y;
    last_shade_width = shade_rect.width;
    last_shade_height = shade_rect.height;
    window.addEventListener('mousemove', onShadeNobMouseMove, { capture: true });
    window.addEventListener('mouseup', onShadeNobMouseUp, { capture: true });
}
function onShadeNobMouseMove(evt: MouseEvent) {
    const new_pos_x = evt.clientX - last_shade_x, new_pos_y = evt.clientY - last_shade_y;
    const x = Math.min(1, Math.max(0, new_pos_x / last_shade_width));
    const y = Math.min(1, Math.max(0, new_pos_y / last_shade_height));
    shade_x.value = x;
    shade_y.value = y;
}
function onShadeNobMouseUp(evt: MouseEvent) {
    removeShadeNobDraggingEvents();
}
function removeShadeNobDraggingEvents() {
    window.removeEventListener('mousemove', onShadeNobMouseMove, { capture: true });
    window.removeEventListener('mouseup', onShadeNobMouseUp, { capture: true });
}
// shade container
function onShadeMouseDown(evt: MouseEvent) {
    window.addEventListener('mousemove', onShadeMouseMove, { capture: true });
    window.addEventListener('mouseup', onShadeMouseUp, { capture: true });
}
async function onShadeMouseMove(evt: MouseEvent) {
    onShadeClick(evt);
    removeShadeEvents();
    onShadeMouseDown(evt);
}
function onShadeMouseUp(evt: MouseEvent) {
    onShadeClick(evt);
    removeShadeEvents();
}
function onShadeClick(evt: MouseEvent) {
    if (props.disabled || shade_ref.value === null) return;
    const shade_rect = shade_ref.value.getBoundingClientRect();
    const new_pos_x = evt.clientX - shade_rect.x, new_pos_y = evt.clientY - shade_rect.y;
    const x = Math.min(1, Math.max(0, new_pos_x / shade_rect.width));
    const y = Math.min(1, Math.max(0, new_pos_y / shade_rect.height));
    shade_x.value = x;
    shade_y.value = y;
}
function removeShadeEvents() {
    window.removeEventListener('mousemove', onShadeMouseMove, { capture: true });
    window.removeEventListener('mouseup', onShadeMouseUp, { capture: true });
}
//#endregion

onBeforeUnmount(() => {
    removeHueNobDraggingEvents();
    removeWheelEvents();
    removeShadeNobDraggingEvents();
    removeShadeEvents();
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-color-picker-button__ {
    position: relative;
    background-color: transparent !important;
	  background-size: 10px 10px;
	  background-position: 0 0, 0 0, 0 5px, 5px -5px, -5px 0;
    background-image: 'linear-gradient(0deg, var(--Color) 0%, var(--Color) 100%), linear-gradient(45deg, var(--placeholder-color-disabled) 25%, transparent 0), linear-gradient(-45deg, var(--placeholder-color-disabled) 25%, transparent 0), linear-gradient(45deg, transparent 75%, var(--placeholder-color-disabled) 0), linear-gradient(-45deg, transparent 75%, var(--placeholder-color-disabled) 0)' % ('');
}

wheel-width = 19px
nob-size = 16px
nob-width = 3px
field-radius-multiplier = 1.2

.__sun-design-color-picker-lineedit__
    text-decoration: none
    &.invalid
        text-decoration: underline red

.__sun-design-color-picker-wheel__
    --HueDegree: -90deg
    --ShadeX: 100%
    --ShadeY: 0%
    position: relative
    width: 100%
    height: 100%
    border-radius: 50%
    background: conic-gradient(from 90deg, rgb(255, 0, 0), rgb(255, 128, 0), rgb(255, 255, 0), rgb(128, 255, 0), rgb(0, 255, 0), rgb(0, 255, 128), rgb(0, 255, 255), rgb(0, 128, 255), rgb(0, 0, 255), rgb(128, 0, 255), rgb(255, 0, 255), rgb(255, 0, 128), rgb(255, 0, 0))
    border: solid-border
    box-sizing: border-box

    .__sun-design-color-picker-wheel-cover__
        box-sizing: border-box
        position: absolute
        inset: wheel-width
        background-color: var(--panel-color)
        border-radius: 50%
        border: solid-border
    
    .__sun-design-color-picker-hue-nob__
        box-sizing: border-box
        width: nob-size
        padding: 0
        margin: 0
        aspect-ratio: 1
        position: absolute
        border-radius: 50%
        left: 'calc(50% + (100% - %s) / 2 * cos(var(--HueDegree)) - %s)' % (wheel-width nob-size / 2)
        top: 'calc(50% + (100% - %s) / 2 * sin(var(--HueDegree)) - %s)' % (wheel-width nob-size / 2)
        border: solid-border
        background-color: var(--attachment-color)
        outline: none

        &::before
            content: ''
            position: absolute
            inset: 0
            background-color: 'hsl(var(--HueDegree), 100%, 50%)' % ('')
            border: var(--attachment-color) nob-width solid
            border-radius: inherit

        &:focus-visible::before
            outline: focus-width var(--focus-color) solid
            outline-offset: focus-offset + border-width

    .__sun-design-color-picker-field__
        box-sizing: border-box
        position: absolute
        inset: 'calc(50% - (50% - %s) / 1.414)' % (wheel-width * field-radius-multiplier)

        &::before
            content: ''
            position: absolute
            inset: 0
            background: 'linear-gradient(0deg, black, transparent), linear-gradient(90deg, white, hsl(var(--HueDegree), 100%, 50%))' % ('')
            border: solid-border
            pointer-events: none
        &[data-size="small"]::before
            border-radius: border-radius-size-small
        &[data-size="normal"]::before
            border-radius: border-radius-size-normal
        &[data-size="large"]::before
            border-radius: border-radius-size-large

        .__sun-design-color-picker-shade-nob__
            box-sizing: border-box
            width: nob-size
            padding: 0
            margin: 0
            aspect-ratio: 1
            position: absolute
            border-radius: 50%
            left: 'calc(var(--ShadeX) - %s)' % (nob-size / 2)
            top: 'calc(var(--ShadeY) - %s)' % (nob-size / 2)
            border: solid-border
            background-color: var(--attachment-color)
            outline: none

            &::before
                content: ''
                position: absolute
                inset: 0
                background-color: var(--PlainColorEdit)
                border: var(--panel-color) nob-width solid
                border-radius: inherit

            &:focus-visible::before
                outline: focus-width var(--focus-color) solid
                outline-offset: focus-offset + border-width

</style>