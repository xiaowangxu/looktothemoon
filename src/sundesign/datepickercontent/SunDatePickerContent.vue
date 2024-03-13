<template>
    <SunPanel vertical container>
        <SunPanelContainer gap>
            <SunControlGroup style="flex: 1;">
                <SunControlGroupRow>
                    <SunNumberEdit :model-value="2024" style="flex: 1;">
                        <template #suffix>
                            年
                        </template>
                    </SunNumberEdit>
                    <SunNumberEdit :model-value="12" suffix="年" style="flex: 1;">
                        <template #suffix>
                            月
                        </template>
                    </SunNumberEdit>
                </SunControlGroupRow>
            </SunControlGroup>
            <SunControlGroup>
                <SunControlGroupRow>
                    <SunButton squared>
                        <ChevronUp />
                    </SunButton>
                    <SunButton squared>
                        <ChevronDown />
                    </SunButton>
                </SunControlGroupRow>
            </SunControlGroup>
        </SunPanelContainer>
        <SunPanelSeparator />
        <SunPanelContainer>
            <div class="__sun-design-datepicker-content-grid__">
                <SunButtonLike squared flat no-hover-color no-pressed-color
                    class="__sun-design-datepicker-content-week__">一
                </SunButtonLike>
                <SunButtonLike squared flat no-hover-color no-pressed-color
                    class="__sun-design-datepicker-content-week__">二
                </SunButtonLike>
                <SunButtonLike squared flat no-hover-color no-pressed-color
                    class="__sun-design-datepicker-content-week__">三
                </SunButtonLike>
                <SunButtonLike squared flat no-hover-color no-pressed-color
                    class="__sun-design-datepicker-content-week__">四
                </SunButtonLike>
                <SunButtonLike squared flat no-hover-color no-pressed-color
                    class="__sun-design-datepicker-content-week__">五
                </SunButtonLike>
                <SunButtonLike squared flat no-hover-color no-pressed-color
                    class="__sun-design-datepicker-content-week__">六
                </SunButtonLike>
                <SunButtonLike squared flat no-hover-color no-pressed-color
                    class="__sun-design-datepicker-content-week__">日
                </SunButtonLike>
                <template v-for="i in 35">
                    <slot>
                        <SunPanelContainer vertical gap no-padding>
                            <SunButton squared flat class="__sun-design-datepicker-content-date-button__"
                                :class="{ sub: i < 4 || i > 27 }">
                                <span>{{ i % 30 }}</span>
                            </SunButton>
                        </SunPanelContainer>
                    </slot>
                </template>
            </div>
        </SunPanelContainer>
        <SunPanelSeparator />
        <SunPanelContainer gap>
            <SunButton style="margin-left: auto;">今天</SunButton>
        </SunPanelContainer>
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

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-datepicker-content-grid__
    display: grid
    grid-template-columns: auto auto auto auto auto auto auto
    gap: panel-padding

.__sun-design-datepicker-content-week__
    // color: var(--placeholder-color) !important

.__sun-design-datepicker-content-date-button__
    &.sub
        & > *
            opacity: major-opacity

</style>