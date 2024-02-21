<template>

    <div style="position: fixed; inset: 0; background-color: rgb(245, 245, 245);">
        <canvas id="render-server-canvas" style="width: 100%; height: 100%;"></canvas>
        <div id="viewport-0" style="position: absolute; overflow: hidden; left: 0%; top: 0%; right: 0%; bottom: 0%;">
            <!-- <div id="render-server-debug"
                style="position: absolute; left: 10px; bottom: 10px; font-size: 10px; color: rgba(231, 13, 213, 0.848); pointer-events: none; font-family: consolas;">
            </div> -->
        </div>
    </div>

    <SunPanelResizeContainer id="editor-left-container" hide-border :nob-size="14" :expand-indicator="false"
        :first-snap="25" :initial-size="240" :max="-300" initial-collapse="first">
        <template #nob>
            <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                <div class="editor-container-nob" style="width: 4px; height: clamp(30px, 6%, 50px);">
                </div>
            </div>
        </template>
        <template #first>
            <SunPanel
                style="width: max(150px, calc(100% - 21px)); position: absolute; right: 7px; margin: 14px 0px; height: calc(100% - 28px);">
            </SunPanel>
        </template>
        <template #second>

            <SunPanelResizeContainer id="editor-right-container" style="position: absolute; inset: 0;" hide-border
                :nob-size="14" :expand-indicator="false" :first-snap="25" flip-direction :initial-size="240" :max="-80" initial-collapse="second">
                <template #nob>
                    <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                        <div class="editor-container-nob" style="width: 4px; height: clamp(30px, 6%, 50px);">
                        </div>
                    </div>
                </template>
                <template #first>

                    <SunPanelResizeContainer id="editor-bottom-container" style="position: absolute; inset: 0;" hide-border
                        :nob-size="14" :expand-indicator="false" :first-snap="25" flip-direction :initial-size="240"
                        vertical :max="-200" initial-collapse="second">
                        <template #nob>
                            <div
                                style="width: 100%; height: 100%;; display: flex; justify-content: center; align-items: center;">
                                <div class="editor-container-nob" style="height: 4px; width: clamp(30px, 6%, 50px);">
                                </div>
                            </div>
                        </template>
                        <template #first>
                            <EditorMenuBar id="top-left-panel" />
                        </template>
                        <template #second>
                            <SunPanel
                                style="height: max(150px, calc(100% - 21px)); position: absolute; top: 7px; margin: 0px 14px; width: calc(100% - 28px);">
                                <WindowFileSystem></WindowFileSystem>
                            </SunPanel>
                        </template>
                    </SunPanelResizeContainer>

                </template>
                <template #second>
                    <SunPanel
                        style="width: max(150px, calc(100% - 21px)); position: absolute; left: 7px; margin: 14px 0px; height: calc(100% - 28px);">
                    </SunPanel>
                </template>
            </SunPanelResizeContainer>

        </template>
    </SunPanelResizeContainer>
    
</template>

<script setup lang="ts">

import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunPanelResizeContainer from '@/sundesign/panel/SunPanelResizeContainer.vue';
import EditorMenuBar from './EditorMenuBar.vue';
import WindowFileSystem from './WindowFileSystem.vue';

</script>

<style>
#editor-left-container {
    position: fixed;
    inset: 0;
}

.editor-container-nob {
    border-radius: 999px;
    background-color: rgba(128, 128, 128, 0.251);
}

#editor-left-container,
#editor-bottom-container,
#editor-right-container {
    pointer-events: none;
}

#editor-left-container>.__sun-design-panel-resize-conatiner-split__,
#editor-bottom-container>.__sun-design-panel-resize-conatiner-split__,
#editor-right-container>.__sun-design-panel-resize-conatiner-split__ {
    pointer-events: initial;
}

#editor-left-container>.__sun-design-panel-resize-conatiner-first__,
#editor-bottom-container>.__sun-design-panel-resize-conatiner-second__,
#editor-right-container>.__sun-design-panel-resize-conatiner-second__ {
    pointer-events: initial;
}

#top-left-panel {
    position: absolute;
    top: 14px;
    left: 14px;
}
</style>