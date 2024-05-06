<template>
    <div v-once style="position: fixed; inset: 0;">
        <div id="viewport-0" style="position: absolute; overflow: hidden; left: 0%; top: 0%; right: 50%; bottom: 0%;">
            <div id="render-server-debug"
                style="position: absolute; left: 10px; bottom: 10px; font-size: 10px; color: rgba(231, 13, 213, 0.848); pointer-events: none; font-family: consolas;">
            </div>
        </div>
        <!-- <div id="viewport-1" style="position: absolute; overflow: hidden; left: 50%; top: 0%; right: 0%; bottom: 50%;">
        </div>
        <div id="viewport-2" style="position: absolute; overflow: hidden; left: 50%; top: 50%; right: 0%; bottom: 0%;">
        </div> -->
    </div>

    <SunPanelResizeContainerRemainNob id="editor-left-container" click-nob-action="toggle" :nob-size="14"
        :expand-indicator="false" :first-snap="25" :initial-size="280" :max="-300" initial-collapse="first">
        <template #nob>
            <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                <button class="editor-container-nob" style="width: 4px; height: clamp(30px, 6%, 50px);">
                </button>
            </div>
        </template>
        <template #first>
            <SunPanel :trap-focus="false"
                style="width: max(150px, calc(100% - 14px)); position: absolute; right: 0px; margin: 14px 0px; height: calc(100% - 28px);">
                <EditorOutline style="width: 100%; height: 100%;" />
            </SunPanel>
        </template>
        <template #second>

            <SunPanelResizeContainerRemainNob id="editor-right-container" click-nob-action="toggle"
                style="position: absolute; inset: 0;" :nob-size="14" :expand-indicator="false" :first-snap="25"
                flip-direction :initial-size="280" :max="-80" initial-collapse="second">
                <template #nob>
                    <div
                        style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                        <button class="editor-container-nob" style="width: 4px; height: clamp(30px, 6%, 50px);">
                        </button>
                    </div>
                </template>
                <template #first>

                    <SunPanelResizeContainerRemainNob id="editor-bottom-container" click-nob-action="toggle"
                        style="position: absolute; inset: 0;" :nob-size="14" :expand-indicator="false" :first-snap="25"
                        flip-direction :initial-size="300" vertical initial-collapse="second">
                        <template #nob>
                            <div
                                style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                                <button class="editor-container-nob" style="height: 4px; width: clamp(30px, 6%, 50px);">
                                </button>
                            </div>
                        </template>
                        <template #first>
                            <EditorMenuBar id="editor-menu-bar" style="position: absolute; top: 14px; left: 0px;" />
                            <EditorCameraControl id="editor-camera-control"
                                style="position: absolute; top: 14px; right: 0px;" />
                        </template>
                        <template #second>
                            <SunPanel :trap-focus="false"
                                style="height: max(150px, calc(100% - 14px)); position: absolute; top: 0px; margin: 0px 0px; width: 100%;">
                                <EditorFileSystem />
                            </SunPanel>
                        </template>
                    </SunPanelResizeContainerRemainNob>

                </template>
                <template #second>
                    <SunPanel vertical :trap-focus="false"
                        style="width: max(200px, calc(100% - 14px)); position: absolute; left: 0px; margin: 14px 0px; height: calc(100% - 28px);">
                        <EditorInspector />
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
import EditorOutline from './EditorOutline.vue';
import EditorFileSystem from './EditorFileSystem.vue';
import EditorCameraControl from './EditorCameraControl.vue';
import EditorInspector from './EditorInspector.vue';

</script>

<style lang="stylus">
@import '../sundesign/SunDesignStyleConstants.styl';

#editor-left-container
    position: fixed
    inset: 0

.editor-container-nob
    border: none
    padding: 0px
    margin: 0px
    cursor: inherit
    border-radius: 999px;
    background-color: var(--placeholder-color-disabled)
    opacity: 75%

    &:focus-visible
        outline: focus-width focus-color solid
        outline-offset: focus-width

#editor-left-container,
#editor-bottom-container,
#editor-right-container {
    pointer-events: none;
}

#editor-menu-bar,
#editor-camera-control,
#editor-left-container>.__sun-design-panel-resize-conatiner-remain-nob-split__,
#editor-bottom-container>.__sun-design-panel-resize-conatiner-remain-nob-split__,
#editor-right-container>.__sun-design-panel-resize-conatiner-remain-nob-split__ {
    pointer-events: initial;
}

#editor-left-container,
#editor-bottom-container,
#editor-right-container,
#editor-left-container>.__sun-design-panel-resize-conatiner-remain-nob-first__,
#editor-left-container>.__sun-design-panel-resize-conatiner-remain-nob-second__,
#editor-bottom-container>.__sun-design-panel-resize-conatiner-remain-nob-first__,
#editor-bottom-container>.__sun-design-panel-resize-conatiner-remain-nob-second__,
#editor-right-container>.__sun-design-panel-resize-conatiner-remain-nob-first__,
#editor-right-container>.__sun-design-panel-resize-conatiner-remain-nob-second__ {
    overflow: visible;
}

#editor-left-container>.__sun-design-panel-resize-conatiner-remain-nob-first__,
#editor-bottom-container>.__sun-design-panel-resize-conatiner-remain-nob-second__,
#editor-right-container>.__sun-design-panel-resize-conatiner-remain-nob-second__ {
    pointer-events: initial;
}

#top-left-panel {
}
</style>