<template>
    <SunMeasurePopupPanel :get-popup-rect="getPopupRect" vertical content-style="width: 100%; height: 100%;"
        @before-measure="onBeforeMeasure" @after-measure="onAfterMeasure">
        <SunPanelContainer no-padding style="height: 28px;">
            <SunScrollContainer content-style="min-height: 100%; width: 100%; display: flex;">
                <SunLabel ref="actionlabel_ref" size="normal" class="__sun-design-calculatepopup-number__"
                    style="color: var(--placeholder-color)">
                    {{ memory_display_value }}</SunLabel>
            </SunScrollContainer>
        </SunPanelContainer>
        <SunPanelSeparator />
        <SunPanelContainer no-padding style="height: 54px;">
            <SunScrollContainer content-style="min-height: 100%; width: 100%; display: flex;">
                <SunLabel ref="valuelabel_ref" size="large" class="__sun-design-calculatepopup-number__">
                    {{ display_value }}</SunLabel>
            </SunScrollContainer>
        </SunPanelContainer>
        <SunPanelSeparator />
        <SunPanelContainer gap>
            <SunPanelContainer no-padding>
                <SunControlGroup>
                    <SunControlGroupRow style="flex: 1;">
                        <SunButton squared><span style="font-size: 18px; min-width: 26px;">7</span></SunButton>
                        <SunButton squared><span style="font-size: 18px; min-width: 26px;">8</span></SunButton>
                        <SunButton squared><span style="font-size: 18px; min-width: 26px;">9</span></SunButton>
                    </SunControlGroupRow>
                    <SunControlGroupRow style="flex: 1;">
                        <SunButton squared><span style="font-size: 18px; min-width: 26px;">4</span></SunButton>
                        <SunButton squared><span style="font-size: 18px; min-width: 26px;">5</span></SunButton>
                        <SunButton squared><span style="font-size: 18px; min-width: 26px;">6</span></SunButton>
                    </SunControlGroupRow>
                    <SunControlGroupRow style="flex: 1;">
                        <SunButton squared><span style="font-size: 18px; min-width: 26px;">1</span></SunButton>
                        <SunButton squared><span style="font-size: 18px; min-width: 26px;">2</span></SunButton>
                        <SunButton squared><span style="font-size: 18px; min-width: 26px;">3</span></SunButton>
                    </SunControlGroupRow>
                    <SunControlGroupRow style="flex: 1;">
                        <SunButton style="flex: 1;"><span style="font-size: 18px; min-width: 26px;">0</span></SunButton>
                        <SunButton squared><span style="font-size: 18px; min-width: 26px;">.</span></SunButton>
                    </SunControlGroupRow>
                </SunControlGroup>
            </SunPanelContainer>
            <SunPanelContainer no-padding gap vertical>
                <SunControlGroup>
                    <SunControlGroupRow>
                        <SunButton squared :color-scheme="ColorSchemeRed">
                            CE
                        </SunButton>
                        <SunButton squared :color-scheme="ColorSchemeRed">
                            <Delete />
                        </SunButton>
                    </SunControlGroupRow>
                </SunControlGroup>
                <SunControlGroup>
                    <SunControlGroupRow>
                        <SunButton squared>
                            <X />
                        </SunButton>
                        <SunButton squared>
                            <Divide />
                        </SunButton>
                    </SunControlGroupRow>
                    <SunControlGroupRow>
                        <SunButton squared>
                            <Plus />
                        </SunButton>
                        <SunButton squared>
                            <Minus />
                        </SunButton>
                    </SunControlGroupRow>
                    <SunControlGroupRow>
                        <SunButton squared>
                            <Equal />
                        </SunButton>
                        <SunButtonPopup squared>
                            <template #button>
                                <MoreHorizontal />
                            </template>
                            <template #popup>
                                <SunPanelContainer gap vertical>
                                    <SunButtonLike :colored="false" flat>
                                        <Pi /> 常数
                                    </SunButtonLike>
                                    <SunButton>pi</SunButton>
                                    <SunButton>tau</SunButton>
                                    <SunButton>e</SunButton>
                                </SunPanelContainer>
                                <SunPanelSeparator />
                                <SunPanelContainer gap vertical>
                                    <SunButtonLike :colored="false" flat>
                                        <TriangleRight /> 三角学
                                    </SunButtonLike>
                                    <SunButton>sin</SunButton>
                                    <SunButton>cos</SunButton>
                                    <SunButton>tan</SunButton>
                                    <SunButton>cot</SunButton>
                                    <SunButton>asin</SunButton>
                                    <SunButton>acos</SunButton>
                                    <SunButton>atan</SunButton>
                                </SunPanelContainer>
                                <SunPanelSeparator />
                                <SunPanelContainer gap vertical>
                                    <SunButtonLike :colored="false" flat>
                                        <Sigma /> 函数
                                    </SunButtonLike>
                                    <SunButton>abs</SunButton>
                                    <SunButton>pow</SunButton>
                                    <SunButton>sqrt</SunButton>
                                    <SunButton>log</SunButton>
                                    <SunButton>ln</SunButton>
                                    <SunButton>log10</SunButton>
                                </SunPanelContainer>
                                <SunPanelSeparator />
                                <SunPanelContainer gap vertical>
                                    <SunButtonLike :colored="false" flat>
                                        <Sigma /> 函数
                                    </SunButtonLike>
                                    <SunButton>mod</SunButton>
                                    <SunButton>floor</SunButton>
                                    <SunButton>ceil</SunButton>
                                    <SunButton>round</SunButton>
                                    <SunButton>rand</SunButton>
                                </SunPanelContainer>
                            </template>
                        </SunButtonPopup>
                    </SunControlGroupRow>
                </SunControlGroup>
                <SunButton :color-scheme="ColorSchemeBlue" style="margin-top: auto;">
                    <ArrowRight />
                </SunButton>
            </SunPanelContainer>
        </SunPanelContainer>
    </SunMeasurePopupPanel>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunMeasurePopupPanel from '../measurepopuppanel/SunMeasurePopupPanel.vue';
import SunPanelContainer from '../panel/SunPanelContainer.vue'
import SunPanelSeparator from '../panel/SunPanelSeparator.vue'
import SunControlGroup from '../controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '../controlgroup/SunControlGroupRow.vue';
import SunButton from '../button/SunButton.vue';
import SunScrollContainer from '../scrollcontainer/SunScrollContainer.vue';
import SunLabel from '../label/SunLabel.vue';
import { Divide, X, Minus, Plus, Equal, ArrowRight, Delete, TriangleRight, Sigma, Pi } from 'lucide-vue-next';
import { type BoxSize, type Rect, ColorSchemeBlue, ColorSchemeRed } from '../SunDesignConstants';
import SunButtonPopup from '../buttonpopup/SunButtonPopup.vue';
import { MoreHorizontal } from 'lucide-vue-next';
import SunButtonLike from '../button/SunButtonLike.vue';
import { computed, ref } from 'vue';

// datas
const negative = ref(false);
const value = ref<string>('0.1234');
const has_digit = computed(() => value.value.includes('.'));
const display_value = computed(() => show_result.value ? memory_value.value ?? '错误' : `${negative.value ? '-' : ''}${value.value}`);
const memory_value = ref<string | undefined>();
const memory_action = ref<string | undefined>('123 +');
const show_result = ref(false);
const memory_display_value = computed(() => memory_action.value ?? '');

const valuelabel_ref = ref<InstanceType<typeof SunLabel> | undefined>();
const actionlabel_ref = ref<InstanceType<typeof SunLabel> | undefined>();

function onBeforeMeasure() {
    if (valuelabel_ref.value?.span) {
        valuelabel_ref.value.span.style.display = 'none';
    }
    if (actionlabel_ref.value?.span) {
        actionlabel_ref.value.span.style.display = 'none';
    }
}

function onAfterMeasure() {
    if (valuelabel_ref.value?.span) {
        valuelabel_ref.value.span.style.display = '';
    }
    if (actionlabel_ref.value?.span) {
        actionlabel_ref.value.span.style.display = '';
    }
}

function getPopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect {
    return { x: 10, y: 10, ...contentMinSize };
}

</script>

<style lang="stylus">

.__sun-design__.__sun-design-label__.__sun-design-calculatepopup-number__
    padding: 6px
    word-break: break-all
    margin: auto 0px auto auto
    text-align: end
    text-overflow: unset
    white-space: break-spaces

</style>