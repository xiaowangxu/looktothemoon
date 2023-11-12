<template>
    <div class="__s__ outliner-item-container" :class="{ last: last }">
        <SFlow vertical style="width: 100%;">
            <SFlow align-v="center" style="width: 100%;">
                <div class="__s__ outliner-item-fold-container">
                    <template v-if="first === last">
                        <svg class="__s__ __s_color__ ouliner-item-relation-svg">
                            <template v-if="!first">
                                <line class="__s__ __s_color__" x1="50%" y1="50%" x2="100%" y2="50%"
                                    style="--SColor: var(--ThemeDisabledBaseColor); stroke: var(--SColorHover);" />
                                <line class="__s__ __s_color__" x1="50%" y1="0%" x2="50%" y2="100%"
                                    style="--SColor: var(--ThemeDisabledBaseColor); stroke: var(--SColorHover);" />
                            </template>
                        </svg>
                    </template>
                    <template v-else-if="first">
                        <svg class="__s__ __s_color__ ouliner-item-relation-svg">
                            <line class="__s__ __s_color__" x1="50%" y1="50%" x2="100%" y2="50%"
                                style="--SColor: var(--ThemeDisabledBaseColor); stroke: var(--SColorHover);" />
                            <line class="__s__ __s_color__" x1="50%" y1="50%" x2="50%" y2="100%"
                                style="--SColor: var(--ThemeDisabledBaseColor); stroke: var(--SColorHover);" />
                        </svg>
                    </template>
                    <template v-else>
                        <svg class="__s__ __s_color__ ouliner-item-relation-svg">
                            <line class="__s__ __s_color__" x1="50%" y1="50%" x2="100%" y2="50%"
                                style="--SColor: var(--ThemeDisabledBaseColor); stroke: var(--SColorHover);" />
                            <line class="__s__ __s_color__" x1="50%" y1="0%" x2="50%" y2="50%"
                                style="--SColor: var(--ThemeDisabledBaseColor); stroke: var(--SColorHover);" />
                        </svg>
                    </template>
                    <SFlow align-v="center" align-h="center" style="position: absolute; width: 100%; height: 100%;">
                        <SButton v-if="has_children" icon-only icon-size="small"
                            @click="children_folded = !children_folded">
                            <ChevronRight v-if="children_folded" />
                            <ChevronDown v-else />
                        </SButton>
                    </SFlow>
                </div>
                <SButton class="outliner-item-button" flat>
                    <SIcon v-if="icon !== undefined" :name="icon"></SIcon>{{ name }}
                </SButton>
                <!-- <SButton icon-only>
                    <Eye />
                </SButton> -->
            </SFlow>
            <SFlow v-show="!children_folded" v-if="has_children" vertical gap="0"
                style="width: 100%; padding-left: var(--SmallMinSize); position: relative;">
                <div v-if="!last" class="outliner-children-item-fold-container">
                    <svg style="width: 100%; height: 100%;">
                        <line class="__s__ __s_color__" x1="50%" y1="0%" x2="50%" y2="100%"
                            style="--SColor: var(--ThemeDisabledBaseColor); stroke: var(--SColorHover);" />
                    </svg>
                </div>
                <OutlinerItem v-for="child, idx in children" :name="idx + ' ' + child.name" :first="false"
                    :last="idx === children.length - 1" :children="child.children" />
            </SFlow>
        </SFlow>
    </div>
</template>

<script setup lang="ts">

import SFlow from '@/components/SFlow.vue';
import SButton from '@/components/SButton.vue';
import { ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-vue-next';
import SIcon from '@/components/SIcon.vue';
import { computed, ref } from 'vue';

export interface OutlinerItem {
    name: string,
    icon?: string,
    children?: OutlinerItem[],
}

// props
const props = withDefaults(
    defineProps<{
        first?: boolean,
        last?: boolean,
        name: string,
        icon?: string,
        children?: OutlinerItem[],
    }>(),
    {
        first: false,
        last: false,
        icon: 'Component',
        children: undefined
    }
);

// data
const has_children = computed(() => props.children !== undefined && props.children.length > 0);
const children_folded = ref(false);

</script>

<style scoped>
.outliner-item-container {
    width: 100%;
    /* height: var(--NormalMinSize); */
    margin-bottom: var(--GapAndMargin);
    box-sizing: border-box;
    /* background-color: red; */
}

.outliner-item-container.last {
    margin-bottom: 0;
}

.outliner-item-fold-container {
    width: var(--SmallMinSize);
    height: var(--NormalMinSize);
    position: relative;
    /* background-color: blue; */
}

.outliner-children-item-fold-container {
    width: var(--SmallMinSize);
    height: var(--NormalMinSize);
    position: absolute;
    height: calc(100% + var(--GapAndMargin));
    top: calc(-1 * var(--GapAndMargin) / 2);
    left: 0;
}

.ouliner-item-relation-svg {
    position: absolute;
    /* background-color: red;
    outline: blue 1px solid;
    outline-offset: -1px; */
    width: 100%;
    height: calc(100% + var(--GapAndMargin));
    top: calc(-1 * var(--GapAndMargin) / 2);
}

.outliner-item-button {
    flex: 1;
}
</style>