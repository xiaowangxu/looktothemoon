<template>
    <div class="canvas-container" :class="{ opened: !folded }">
        <div class="top-left-panel">
            <SFlow>
                <SPanel class="pointer-event">
                    <SButton icon-only icon-size="medium" flat :active="!folded" @click="folded = !folded;">
                        <PanelLeftInactive />
                    </SButton>
                </SPanel>
                <SPanel class="pointer-event">
                    <SFlow>
                        <SButton icon-only>
                            <Undo2 />
                        </SButton>
                        <SButton icon-only>
                            <Redo2 />
                        </SButton>
                    </SFlow>
                </SPanel>
            </SFlow>
        </div>
        <div class="top-panel">
            <SFlow align-h="center" align-v="start" style="width: 100%; height: 100%;">
                <SPanel class="pointer-event" style="overflow: auto;">
                    <SFlow>
                        <SLineEdit :clearable="false" :align-text="align" v-model:value="lineedit" lazy />
                        <SNumberEdit v-model:value="numberedit" prefix="长度 " lazy />
                        <SCheckBox/>
                        <SButton color="var(--ColorRed)">
                            <X />取消
                        </SButton>
                        <SButton color="var(--ColorGreen)" icon-only>
                            <Check />
                        </SButton>
                    </SFlow>
                </SPanel>
            </SFlow>
        </div>
        <div class="top-right-panel">
            <SFlow align-h="end">
                <SPanel class="pointer-event" style="width: 80px; height: 80px; border-radius: 50%;">
                </SPanel>
            </SFlow>
        </div>
        <div class="left-panel">
            <SFlow vertical align-h="start" align-v="center" style="width: 100%; height: 100%;">
                <SPanel class="pointer-event">
                    <SFlow vertical>
                        <SButton icon-only icon-size="medium" flat>
                            <Search />
                        </SButton>
                    </SFlow>
                </SPanel>
                <SPanel class="pointer-event" style="overflow: auto;">
                    <SFlow vertical>
                        <SButton icon-only icon-size="medium">
                            <Globe />Normal
                        </SButton>
                        <SButton icon-only icon-size="medium" active>
                            <Workflow />active
                        </SButton>
                        <SButton icon-only icon-size="medium" active disabled>
                            <Globe />active disabled
                        </SButton>
                        <SButton icon-only icon-size="medium" flat>
                            <Globe />flat
                        </SButton>
                        <SButton icon-only icon-size="medium" flat active>
                            <Globe />flat active
                        </SButton>
                        <SButton icon-only icon-size="medium" flat active disabled>
                            <Globe />flat active disabled
                        </SButton>
                        <SButton icon-only icon-size="medium" flat disabled>
                            <Globe />flat disabled
                        </SButton>
                        <SButton icon-only icon-size="medium" disabled>
                            <Globe />disabled
                        </SButton>
                        <SButton icon-only icon-size="medium">
                            <Globe />
                        </SButton>
                    </SFlow>
                </SPanel>
            </SFlow>
        </div>
        <div class="right-panel">
            <SFlow vertical align-h="start" align-v="center" style="width: 100%; height: 100%;">
                <SPanel class="pointer-event" style="width: 300px; height: 100%;">
                    <STitle align-h="center">
                        <SSpan bold italic underline>Typography</SSpan> 排版组件
                    </STitle>
                    <SSubTitle color="var(--ColorRed)" align-h="end">
                        <SSpan bold>Sub Title</SSpan>
                    </SSubTitle>
                    <SParagraph>Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta facere eos
                        dolores, iusto similique ut optio <SSpan bold text-size="medium" color="var(--ColorGreen)"><X style="vertical-align: bottom;"/>Hello</SSpan>
                        possimus quisquam, unde fugiat magnam sequi id debitis voluptate
                        nobis excepturi aut distinctio consequuntur?
                    </SParagraph>
                    <SParagraph>Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta facere eos
                        dolores, iusto similique ut optio <SSpan bold text-size="medium" color="var(--ColorGreen)"><X style="vertical-align: bottom;"/>Hello</SSpan>
                        possimus quisquam, unde fugiat magnam sequi id debitis voluptate
                        nobis excepturi aut distinctio consequuntur?
                    </SParagraph>
                    <SSubTitle>
                        <SSpan bold>Sub Title 2</SSpan>
                    </SSubTitle>
                    <SParagraph>Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta facere eos
                        dolores, iusto similique ut optio <SSpan bold text-size="medium" color="var(--ColorGreen)"><X style="vertical-align: bottom;"/>Hello</SSpan>
                        possimus quisquam, unde fugiat magnam sequi id debitis voluptate
                        nobis excepturi aut distinctio consequuntur?
                    </SParagraph>
                    <SParagraph>Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta facere eos
                        dolores, iusto similique ut optio <SSpan bold text-size="medium" color="var(--ThemeColor)"><X style="vertical-align: bottom;"/>Hello</SSpan>
                        possimus quisquam, unde fugiat magnam sequi id debitis voluptate
                        nobis excepturi aut distinctio consequuntur?
                    </SParagraph>
                </SPanel>
            </SFlow>
        </div>
    </div>
</template>
<script setup lang="ts">
import { type Alignment } from '@/components/SConst';
import SPanel from '@/components/SPanel.vue';
import SButton from '@/components/SButton.vue';
import SLineEdit from '@/components/SLineEdit.vue';
import SNumberEdit from '@/components/SNumberEdit.vue';
import SCheckBox from '@/components/SCheckBox.vue';
import SFlow from '@/components/SFlow.vue';
import { X, Check, Workflow, Globe, Search, Undo2, Redo2, PanelLeftInactive } from 'lucide-vue-next';
import { ref, watch } from 'vue';
import SSpan from '@/components/Typography/SSpan.vue';
import SLabel from '@/components/Typography/SLabel.vue';
import STitle from '@/components/Typography/STitle.vue';
import SSubTitle from '@/components/Typography/SSubTitle.vue';
import SParagraph from '@/components/Typography/SParagraph.vue';

const folded = ref(true);
const align = ref<Alignment>('end');
const lineedit = ref('hahaha');
const numberedit = ref(123);

watch(lineedit, (newval, oldval) => {
    console.log(newval, oldval);
});
watch(numberedit, (newval, oldval) => {
    console.log(newval, oldval);
});

</script>
<style scoped>
.canvas-container {
    pointer-events: none;
    position: fixed;
    inset: 14px;
    left: 14px;
    transition: left 0.2s ease-out;
}

.pointer-event {
    pointer-events: all;
}

.canvas-container.opened {
    left: 200px;
    transition: left 0.2s ease-out;
}

.top-left-panel {
    position: absolute;
    top: 0px;
    left: 0px;
}

.top-panel {
    position: absolute;
    top: 0px;
    left: 200px;
    right: 200px;
}

.top-right-panel {
    position: absolute;
    top: 0px;
    right: 0px;
}

.left-panel {
    position: absolute;
    left: 0px;
    top: 100px;
    bottom: 100px;
}

.right-panel {
    position: absolute;
    right: 0px;
    top: 120px;
    bottom: 120px;
}
</style>