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
            <SFlow :align-h="Alignment.Center" :align-v="Alignment.Start" style="width: 100%; height: 100%;">
                <SPanel class="pointer-event" style="overflow: auto;">
                    <SFlow>
                        <SLineEdit :clearable="false" />
                        <SLineEdit color="var(--ColorBlue)" disabled />
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
            <SFlow :align-h="Alignment.End">
                <SPanel class="pointer-event" style="width: 80px; height: 80px; border-radius: 50%;">
                </SPanel>
            </SFlow>
        </div>
        <div class="left-panel">
            <SFlow vertial :align-h="Alignment.Start" :align-v="Alignment.Center" style="width: 100%; height: 100%;">
                <SPanel class="pointer-event">
                    <SFlow vertial>
                        <SButton icon-only icon-size="medium" flat>
                            <Search />
                        </SButton>
                    </SFlow>
                </SPanel>
                <SPanel class="pointer-event" ref="LeftPanel" style="overflow: auto;">
                    <SFlow vertial>
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
    </div>
</template>
<script setup lang="ts">
import { Alignment } from '@/components/SConst';
import SPanel from '@/components/SPanel.vue';
import SButton from '@/components/SButton.vue';
import SLineEdit from '@/components/SLineEdit.vue';
import SFlow from '@/components/SFlow.vue';
import { X, Check, Workflow, Globe, Search, Undo2, Redo2, PanelLeftInactive } from 'lucide-vue-next';
import { ref } from 'vue';

const folded = ref(true);
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
</style>