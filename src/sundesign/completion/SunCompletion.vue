<template>
    <SunMeasurePopupPanelNoScroll :get-popup-rect="getPopupRect" :stop-events="false" check-passive-click-outside>
        <SunPanel container vertical style="flex: 1.75;">
            <SunScrollContainer style="flex: 1;" content-style="width: 100%;">
                <SunPanelContainer vertical style="width: 100%;">
                    <SunButton v-for=" i  in  5" style="width: 100%;" flat>
                        <span class="__sun-design-button-item-label__ has-description">.to<span
                                style="color: var(--focus-color); font-weight: bold;">Str</span>ing({{ i }})</span>
                        <span class="__sun-design-button-item-description__">Lorem ipsum dolor</span>
                        <!-- <SunButtonItem :label="'.toString(' + i.toString() + ')'" icon="Cuboid"
                            description="Lorem ipsum dolor" /> -->
                    </SunButton>
                </SunPanelContainer>
            </SunScrollContainer>
            <SunPanelSeparator />
            <SunPanelContainer minor no-padding>
                <SunButtonLike no-hover-color no-pressed-color flat style="width: 100%;">
                    <SunButtonItem label="快捷操作" description="使用上下键切换 / Enter 确认" />
                </SunButtonLike>
            </SunPanelContainer>
        </SunPanel>
        <!-- <SunPanelSeparator />
        <SunPanelContainer style="flex: 1;">

        </SunPanelContainer> -->
    </SunMeasurePopupPanelNoScroll>
</template>

<script setup lang="ts">

import SunMeasurePopupPanelNoScroll from '../measurepopuppanel/SunMeasurePopupPanelNoScroll.vue';
import SunButton from '../button/SunButton.vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import SunPanel from '../panel/SunPanel.vue';
import SunPanelContainer from '../panel/SunPanelContainer.vue';
import SunPanelSeparator from '../panel/SunPanelSeparator.vue';
import SunScrollContainer from '../scrollcontainer/SunScrollContainer.vue';
import { type BoxSize, type Rect } from '../SunDesignConstants';

function getPopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect {
    return { x: 100, y: 100, width: 400, height: Math.min(contentMinSize.height, 300) };
}

</script>