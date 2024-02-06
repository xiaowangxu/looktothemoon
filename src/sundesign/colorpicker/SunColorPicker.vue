<template>
    <SunButtonPopup ref="buttonpopup_ref" style="position: relative; background-color: transparent;" v-bind="$attrs"
        :size="size" :flat="flat" :bordered="bordered" :borderMask="borderMask" :rounded="rounded" :squared="squared"
        :disabled="disabled" drop-shadow mode="instance" vertical content-style="width: 100%; max-width: 180px;"
        :getPopupRect="getPopupRect" scrollable-indicators>
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
            <SunPanelContainer gap vertical style="min-height: 120px; flex-shrink: 0;">
                <SunPanelContainer gap no-padding style="flex: 1;"
                    :style="{ '--HueColor': hue_color, '--Color': color_str_without_alpha }">
                    <SunRange v-memo="[hue]" v-model="hue" :active="false"
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
                    </div>
                    <!-- <div v-else-if="edit_format === 'HSL'"
                    style="flex: 1; border-radius: 6px;	background: linear-gradient(0deg, black, transparent, white), linear-gradient(90deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red);" /> -->
                </SunPanelContainer>
            </SunPanelContainer>
            <SunPanelSeparator override-vertical />
            <!-- Input -->
            <SunPanelContainer gap style="flex-shrink: 0;">
                <SunPanelContainer gap no-padding vertical style="flex: 1;">
                    <SunControlGroup>
                        <SunControlGroupRow>
                            <SunNumberEdit :model-value="255" :min="0" :max="255" :step="1" progress
                                progress-color="var(--border-color-disabled)" style="flex: 1;">
                                <template #suffix> {{ edit_label_r }} </template>
                            </SunNumberEdit>
                        </SunControlGroupRow>
                        <SunControlGroupRow>
                            <SunNumberEdit :model-value="255" :min="0" :max="255" :step="1" progress
                                progress-color="var(--border-color-disabled)" style="flex: 1;">
                                <template #suffix> {{ edit_label_g }} </template>
                            </SunNumberEdit>
                        </SunControlGroupRow>
                        <SunControlGroupRow>
                            <SunNumberEdit :model-value="255" :min="0" :max="255" :step="1" progress
                                progress-color="var(--border-color-disabled)" style="flex: 1;">
                                <template #suffix> {{ edit_label_b }} </template>
                            </SunNumberEdit>
                        </SunControlGroupRow>
                        <SunControlGroupRow>
                            <SunNumberEdit :model-value="255" :min="0" :max="255" :step="1" style="flex: 1;">
                                <template #suffix> {{ edit_label_a }} </template>
                            </SunNumberEdit>
                        </SunControlGroupRow>
                    </SunControlGroup>
                    <SunControlGroup style="flex: 1;">
                        <SunControlGroupRow>
                            <SunLineEdit style="flex: 1;" />
                            <SunButton squared>
                                <ClipboardCopy />
                            </SunButton>
                            <SunSelect style="width: min-content; align-self: flex-end;" icon-only squared
                                v-model="code_format"
                                :options="[[{ label: 'Hex', uid: true }, { label: 'Color String', uid: false }]]">
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
                        <SunControlGroupRow>
                            <SunButton squared @click="onEyeDropper">
                                <Pipette />
                            </SunButton>
                        </SunControlGroupRow>
                    </SunControlGroup>
                    <SunControlGroup style="margin-top: auto;">
                        <SunControlGroupRow>
                            <SunSelect icon-only squared v-model="library"
                                :options="[[{ label: '最近使用', uid: 8 }, { label: 'Color String', uid: 200 }]]">
                                <template #closed>
                                    <Bookmark />
                                </template>
                                <template #opened>
                                    <Bookmark />
                                </template>
                            </SunSelect>
                        </SunControlGroupRow>
                        <SunControlGroupRow>
                            <SunButton squared>
                                <Plus />
                            </SunButton>
                        </SunControlGroupRow>
                    </SunControlGroup>
                </SunPanelContainer>
            </SunPanelContainer>
            <SunPanelSeparator override-vertical />
            <!-- Library -->
            <SunPanelContainer gap style="flex-wrap: wrap;">
                <SunButton v-for="i in library" class="__sun-design-transparent-bg__" size="small" squared
                    style="position: relative;">
                    <div style="position: absolute; inset: 0; background: rgba(123, 233, 12, 0.5);" />
                </SunButton>
            </SunPanelContainer>
        </template>
    </SunButtonPopup>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
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

// props
const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        bordered?: boolean,
        borderMask?: BorderMask,
        // equalPadding?: boolean,
        rounded?: boolean,
        squared?: boolean,
        disabled?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        bordered: true,
        borderMask: 15,
        rounded: false,
        squared: false,
        disabled: false,
    }
);

// datas
const hue = ref(0);
const hue_color = computed(() => `hsl(${hue.value}deg, 100%, 50%)`);
const alpha = ref(1);
const lum_sat = ref<[number, number]>([100, 100]);
const color_str_without_alpha = computed(() => `hsl(${hue.value}deg, ${lum_sat.value[0]}%, ${lum_sat.value[1]}%)`);
const color_str = computed(() => `hsl(${hue.value}deg, ${lum_sat.value[0]}%, ${lum_sat.value[1]}%, ${alpha.value})`);

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
    const btn_rect = { ...buttonRect };
    if (btn_rect.width > contentMinSize.width) {
        btn_rect.x += (btn_rect.width - contentMinSize.width) / 2;
        btn_rect.width = contentMinSize.width;
    }
    return calcButtonPopupRect(btn_rect, contentMinSize, windowSize, 0);
}

function onEyeDropper() {
    useEyeDropper().open().then();
}

</script>

<style lang="stylus">

.__sun-design-transparent-bg__ {
    background-color: transparent !important;
    background-image: linear-gradient(45deg,#ccc 25%,transparent 0), linear-gradient(-45deg,#ccc 25%,transparent 0), linear-gradient(45deg,transparent 75%,#ccc 0), linear-gradient(-45deg,transparent 75%,#ccc 0);
	background-size: 10px 10px;
	background-position: 0 0, 0 5px, 5px -5px, -5px 0;
}
</style>