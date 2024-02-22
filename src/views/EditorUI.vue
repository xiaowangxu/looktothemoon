<template>
    <div style="position: fixed; inset: 0; background-color: rgb(245, 245, 245);">
        <canvas id="render-server-canvas" style="width: 100%; height: 100%;"></canvas>
        <div id="viewport-0" style="position: absolute; overflow: hidden; left: 0%; top: 0%; right: 0%; bottom: 0%;">
            <!-- <div id="render-server-debug"
                style="position: absolute; left: 10px; bottom: 10px; font-size: 10px; color: rgba(231, 13, 213, 0.848); pointer-events: none; font-family: consolas;">
            </div> -->
        </div>
        <!-- <div id="viewport-1" style="position: absolute; overflow: hidden; left: 50%; top: 0%; right: 0%; bottom: 0%;">
        </div> -->
    </div>

    <SunPanelResizeContainerRemainNob id="editor-left-container" :nob-size="14" :expand-indicator="false"
        :first-snap="25" :initial-size="240" :max="-300" hide-border initial-collapse="first">
        <template #nob>
            <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                <div class="editor-container-nob" style="width: 4px; height: clamp(30px, 6%, 50px);">
                </div>
            </div>
        </template>
        <template #first>
            <SunPanel
                style="width: max(150px, calc(100% - 14px)); position: absolute; right: 0px; margin: 14px 0px; height: calc(100% - 28px);">
            </SunPanel>
        </template>
        <template #second>

            <SunPanelResizeContainerRemainNob id="editor-right-container" style="position: absolute; inset: 0;" hide-border
                :nob-size="14" :expand-indicator="false" :first-snap="25" flip-direction :initial-size="240" :max="-80"
                initial-collapse="second">
                <template #nob>
                    <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                        <div class="editor-container-nob" style="width: 4px; height: clamp(30px, 6%, 50px);">
                        </div>
                    </div>
                </template>
                <template #first>

                    <SunPanelResizeContainerRemainNob id="editor-bottom-container" style="position: absolute; inset: 0;" hide-border
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
                                style="height: max(150px, calc(100% - 14px)); position: absolute; top: 0px; margin: 0px 0px; width: 100%;">
                                <EditorFileSystem />
                            </SunPanel>
                        </template>
                    </SunPanelResizeContainerRemainNob>

                </template>
                <template #second>
                    <SunPanel
                        style="width: max(150px, calc(100% - 14px)); position: absolute; left: 0px; margin: 14px 0px; height: calc(100% - 28px);">
                    </SunPanel>
                </template>
            </SunPanelResizeContainerRemainNob>

        </template>
    </SunPanelResizeContainerRemainNob>
</template>

<script setup lang="ts">

import SunPanel from '@/sundesign/panel/SunPanel.vue';
import SunPanelResizeContainerRemainNob from '@/sundesign/panel/SunPanelResizeContainerRemainNob.vue';
import EditorMenuBar from './EditorMenuBar.vue';
import EditorFileSystem from './EditorFileSystem.vue';

</script>

<style lang="stylus">
#editor-left-container {
    position: fixed;
    inset: 0;
}

.editor-container-nob
    border-radius: 999px;
    background-color: var(--placeholder-color-disabled)
    opacity: 75%

#editor-left-container,
#editor-bottom-container,
#editor-right-container {
    pointer-events: none;
}

#editor-left-container>.__sun-design-panel-resize-conatiner-remain-nob-split__,
#editor-bottom-container>.__sun-design-panel-resize-conatiner-remain-nob-split__,
#editor-right-container>.__sun-design-panel-resize-conatiner-remain-nob-split__ {
    pointer-events: initial;
}

#editor-left-container>.__sun-design-panel-resize-conatiner-remain-nob-first__,
#editor-bottom-container>.__sun-design-panel-resize-conatiner-remain-nob-second__,
#editor-right-container>.__sun-design-panel-resize-conatiner-remain-nob-second__ {
    pointer-events: initial;
}

#top-left-panel {
    position: absolute;
    top: 14px;
    left: 0px;
}
</style>