<template>
    <SunButtonPopup ref="buttonpopup_ref" style="position: relative; background-color: transparent;" v-bind="$attrs"
        :size="size" popup-size="normal" :flat="flat" :borderMask="borderMask" :rounded="rounded" :squared="squared"
        :disabled="disabled" drop-shadow mode="instance" vertical
        content-style="width: 100%; min-width: 180px; max-width: 180px;" :getPopupRect="getPopupRect" scrollable-indicators>
        <template #button>
            <div class="__sun-design-transparent-bg__" style="position: absolute; inset: 0; z-index: -1;">
                <div style="position: absolute; inset: 0;" :style="{ background: color_str }" />
            </div>
        </template>
        <template #popup>

            <!-- Previewer -->
            <SunPanelContainer gap style="flex-shrink: 0;">
                <div class="__sun-design__ __sun-design-transparent-bg__  bordered"
                    style="flex: 1; position: relative; overflow: hidden; border-radius: 6px;">
                    <div style="position: absolute; inset: 0; right: 50%;" :style="{ background: color_str }" />
                    <div style="position: absolute; inset: 0; left: 50%; background: rgba(123, 233, 12, 0.5);" />
                </div>
                <SunButton squared>
                    <RotateCcw />
                </SunButton>
            </SunPanelContainer>
            <SunPanelSeparator override-vertical />

            <!-- Picker -->
            <SunPanelContainer gap vertical style="min-height: 120px; aspect-ratio: 1; flex-shrink: 0;">
                <SunPanelContainer gap no-padding style="flex: 1;">
                    <div class="__sun-design-color-picker-wheel__">
                        <button class="__sun-design-color-picker-hue-nob__"></button>
                        <div class="__sun-design-color-picker-field__" :data-size="size">
                            <button class="__sun-design-color-picker-shade-nob__"
                                :style="{ '--Color': color_str }"></button>
                        </div>
                    </div>
                    <!-- <SunRange v-memo="[hue]" v-model="hue" :active="false"
                        style="background: linear-gradient(0deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red);"
                        vertical :min="0" :max="360" :progress="false"
                        :ticks="[0, 360 * 0.17, 360 * 0.33, 180, 360 * 0.67, 360 * 0.83, 360]" />
                    <SunRange2D v-memo="[lum_sat]" v-model="lum_sat" :active="false" style="flex: 1; border-radius: 6px; align-self: stretch;
									background: linear-gradient(0deg, black, transparent), linear-gradient(90deg, white, var(--HueColor));"
                        :min="[0, 0]" :max="[100, 100]" />
                    <div class="__sun-design-transparent-bg__"
                        style="min-width: 24px; border-radius: 6px; position: relative; overflow: hidden;">
                        <SunRange v-memo="[alpha]" v-model="alpha" :active="false"
                            style="background: linear-gradient(180deg, var(--Color), transparent); height: 100%;" vertical
                            :min="0" :max="1" :progress="false" />
                    </div> -->
                </SunPanelContainer>
            </SunPanelContainer>
            <SunPanelSeparator override-vertical />
            <!-- <div v-else-if="edit_format === 'HSL'"
                    style="flex: 1; border-radius: 6px;	background: linear-gradient(0deg, black, transparent, white), linear-gradient(90deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red);" /> -->

            <!-- Input -->
            <SunPanelContainer gap style="flex-shrink: 0;" vertical>
                <SunPanelContainer gap no-padding style="flex: 1;">
                    <SunControlGroup style="flex: 1;">
                        <SunControlGroupRow>
                            <SunNumberEdit v-model="red" :min="0" :max="255" :step="1" :value-snap-gap="1" :drag-factor="2"
                                style="flex: 1;">
                                <template #suffix> {{ edit_label_r }} </template>
                            </SunNumberEdit>
                        </SunControlGroupRow>
                        <SunControlGroupRow>
                            <SunNumberEdit v-model="green" :min="0" :max="255" :step="1" :value-snap-gap="1"
                                :drag-factor="2" style="flex: 1;">
                                <template #suffix> {{ edit_label_g }} </template>
                            </SunNumberEdit>
                        </SunControlGroupRow>
                        <SunControlGroupRow>
                            <SunNumberEdit v-model="blue" :min="0" :max="255" :step="1" :value-snap-gap="1" :drag-factor="2"
                                style="flex: 1;">
                                <template #suffix> {{ edit_label_b }} </template>
                            </SunNumberEdit>
                        </SunControlGroupRow>
                        <SunControlGroupRow>
                            <SunNumberEdit v-model="alpha" :min="0" :max="255" :step="1" :value-snap-gap="1"
                                :drag-factor="2" style="flex: 1;">
                                <template #suffix> {{ edit_label_a }} </template>
                            </SunNumberEdit>
                        </SunControlGroupRow>
                    </SunControlGroup>
                    <SunPanelContainer gap no-padding vertical>
                        <SunControlGroup>
                            <SunControlGroupRow>
                                <SunButton squared @click="onEyeDropper">
                                    <Pipette />
                                </SunButton>
                            </SunControlGroupRow>
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
                        <SunLineEdit v-model.lazy="color_str" style="flex: 1;" />
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
            <SunPanelSeparator override-vertical />

            <!-- Library -->
            <SunPanelFoldContainer label="最近使用" initial-fold
                @toggle="() => $nextTick(() => buttonpopup_ref?.refreshPopupContentMinSize())">
                <SunPanelContainer gap style="flex-wrap: wrap;">
                    <SunButton v-for="i in library" class="__sun-design-transparent-bg__" size="small" squared
                        style="position: relative;">
                        <div style="position: absolute; inset: 0; background: rgba(123, 233, 12, 0.5);" />
                    </SunButton>
                </SunPanelContainer>
            </SunPanelFoldContainer>
            <SunPanelSeparator />
            <SunPanelFoldContainer label="收藏" initial-fold hover-show-append
                @toggle="() => $nextTick(() => buttonpopup_ref?.refreshPopupContentMinSize())">
                <template #append>
                    <SunButton squared flat size="small" title="将颜色添加到收藏">
                        <Plus />
                    </SunButton>
                </template>
                <SunPanelContainer gap style="flex-wrap: wrap;">
                    <SunButton v-for="i in library" class="__sun-design-transparent-bg__" size="small" squared
                        style="position: relative;">
                        <div style="position: absolute; inset: 0; background: rgba(123, 233, 12, 0.5);" />
                    </SunButton>
                </SunPanelContainer>
            </SunPanelFoldContainer>

        </template>
    </SunButtonPopup>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunButtonItemEditable from '../item/SunButtonItemEditable.vue';
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
import { RotateCcw, Pipette, Plus, Hash, Palette, ClipboardCopy, Bookmark } from 'lucide-vue-next';
import { calcButtonPopupRect, type Rect, type BoxSize, type Size, type BorderMask } from '../SunDesignConstants';
import { computed, ref, watch } from 'vue';
import { useColorPickerData } from './SunColorPickerConstants';
import SunRange from '../range/SunRange.vue';
import SunRange2D from '../range/SunRange2D.vue';
import { useEyeDropper } from '@vueuse/core';
import { vHoverMenu } from '../hovermenu/SunHoverMenu';

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        borderMask?: BorderMask,
        // equalPadding?: boolean,
        rounded?: boolean,
        squared?: boolean,
        disabled?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        borderMask: 15,
        rounded: false,
        squared: false,
        disabled: false,
    }
);

// datas
const red = ref(255);
const green = ref(255);
const blue = ref(255);
const alpha = ref(255);

const color_str_without_alpha = computed(() => `rgb(${red.value}, ${green.value}, ${blue.value})`);
const color_str = computed({
    get: () => `#${red.value.toString(16).padStart(2, '0').toUpperCase()}${green.value.toString(16).padStart(2, '0').toUpperCase()}${blue.value.toString(16).padStart(2, '0').toUpperCase()}${alpha.value === 255 ? '' : alpha.value.toString(16).padStart(2, '0').toUpperCase()}`,//`rgba(${red.value}, ${green.value}, ${blue.value}, ${alpha.value / 255})`,
    set: (str) => {

    },
});

const {
    edit_formats, edit_format,
    edit_label_r, edit_label_g, edit_label_b, edit_label_a,
    code_format,
    library
} = useColorPickerData();
const buttonpopup_ref = ref<InstanceType<typeof SunButtonPopup> | undefined>();

watch([library], () => {
    buttonpopup_ref?.value?.refreshPopupContentMinSize();
}, { flush: 'post' });

function getPopupRect(buttonRect: Rect, contentMinSize: BoxSize, windowSize: BoxSize): Rect {
    return calcButtonPopupRect(buttonRect, contentMinSize, windowSize, buttonRect.width > contentMinSize.width ? 1 : 0, 0, undefined, undefined, false);
}

function onEyeDropper() {
    useEyeDropper().open().then();
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-transparent-bg__ {
    background-color: transparent !important;
    background-image: 'linear-gradient(45deg, var(--placeholder-color-disabled) 25%, transparent 0), linear-gradient(-45deg, var(--placeholder-color-disabled) 25%, transparent 0), linear-gradient(45deg, transparent 75%, var(--placeholder-color-disabled) 0), linear-gradient(-45deg, transparent 75%, var(--placeholder-color-disabled) 0)' % ('');
	  background-size: 10px 10px;
	  background-position: 0 0, 0 5px, 5px -5px, -5px 0;
}

wheel-width = 19px
nob-size = 16px
nob-width = 3px
field-radius-multiplier = 1.2

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

    &::before
        content: ''
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
        background: 'linear-gradient(0deg, black, transparent), linear-gradient(90deg, white, hsl(var(--HueDegree), 100%, 50%))' % ('')
        border: solid-border
        &[data-size="small"]
            border-radius: border-radius-size-small
        &[data-size="normal"]
            border-radius: border-radius-size-normal
        &[data-size="large"]
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
                background-color: var(--Color)
                border: var(--panel-color) nob-width solid
                border-radius: inherit

            &:focus-visible::before
                outline: focus-width var(--focus-color) solid
                outline-offset: focus-offset + border-width

</style>