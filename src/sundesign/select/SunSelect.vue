<template>
    <SunButton class="__sun-design-select-button__" :class="{ opened }" :active="active" :disabled="disabled" :size="size"
        :flat="flat" :border-mask="borderMask" :bordered="bordered" :color-scheme="selected?.colorScheme ?? colorScheme"
        @click="opened = !opened">
        <template v-if="selected !== undefined">
            <SunIcon v-if="selected?.icon !== undefined" :name="selected?.icon"></SunIcon>
            <span class="__sun-design-select-label__">{{ selected?.label }}</span>
            <span class="__sun-design-select-description__">
                {{ selected?.description }}
            </span>
            <SunKeyboard v-if="selected?.shortcut !== undefined">{{ selected?.shortcut }}</SunKeyboard>
        </template>
        <template v-else>
            <slot name="empty">
                <span class="__sun-design-select-empty__">无选中项</span>
            </slot>
        </template>
        <slot name="closed">
            <ChevronDown />
        </slot>
    </SunButton>
    <SunPopup :visible="opened" :rect="{ x: 16, y: 39, width: 200, height: 300 }">
        <SunPanel class="__sun-design-select-panel__" style="width: 100%; height: 100%;" :size="size">
            <SunScrollContainer width="100%">
                <template v-for="option in options">
                    <SunPanelContainer vertical>
                        <template v-for="item in option">
                            <SunButton v-if="item?.asTitle !== true" class="__sun-design-select-item__" :size="size"
                                :active="(value !== undefined && item.uid === value) || item?.active" flat
                                :disabled="item?.disabled" :color-scheme="item?.colorScheme"
                                @click="onClick(item.uid, $event)">
                                <SunIcon v-if="item?.icon !== undefined" :name="item?.icon"></SunIcon>
                                <span class="__sun-design-select-label__">{{ item?.label }}</span>
                                <span class="__sun-design-select-description__">
                                    {{ item?.description }}
                                </span>
                                <SunKeyboard v-if="item?.shortcut !== undefined">{{ item?.shortcut }}</SunKeyboard>
                            </SunButton>
                            <SunButtonLike v-else :size="size" :color-scheme="item?.colorScheme"><span
                                    class="__sun-design-select-title__">{{ item.label }}</span>
                            </SunButtonLike>
                        </template>
                    </SunPanelContainer>
                    <SunPanelSeparator :override-vertical="true" />
                </template>
            </SunScrollContainer>
        </SunPanel>
    </SunPopup>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import { type Size, type Item, type BorderMask, type ColorScheme, UID } from '../SunDesignConstants';
import SunButton from '../button/SunButton.vue';
import SunButtonLike from '../button/SunButtonLike.vue';
import SunIcon from '../icon/SunIcon.vue';
import SunPopup from '../popup/SunPopup.vue';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import SunKeyboard from '../keyboard/SunKeyboard.vue';
import SunPanel from '../panel/SunPanel.vue';
import SunPanelSeparator from '../panel/SunPanelSeparator.vue';
import SunPanelContainer from '../panel/SunPanelContainer.vue';
import SunScrollContainer from '../scrollcontainer/SunScrollContainer.vue';

// props

const props = withDefaults(
    defineProps<{
        size?: Size,
        flat?: boolean,
        bordered?: boolean,
        borderMask?: BorderMask,
        colorScheme?: ColorScheme,
        options: Item[][],
        value: UID,
        active?: boolean,
        disabled?: boolean,
    }>(),
    {
        size: 'normal',
        flat: false,
        bordered: true,
        borderMask: 15,
        active: false,
        disabled: false,
    }
);

const opened = ref(false);
const value = ref<UID | undefined>(undefined);

// data
const selected = computed(() => {
    const uid = value.value;
    if (uid === undefined) return undefined;
    return props.options.flat().find(s => s.uid === uid);
});

// methods
function onClick(uid: UID, event: InputEvent) {
    value.value = uid;
    opened.value = false;
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-select-button__ 
    width: 200px

    &.opened
        border-bottom-left-radius: 0 !important
        border-bottom-right-radius: 0 !important

    > span
        background-color: unset
        overflow: hidden
        white-space: nowrap
        text-overflow: ellipsis

.__sun-design__.__sun-design-select-panel__
    &[data-size]
        border-top-left-radius: 0 !important
        border-top-right-radius: 0 !important

.__sun-design-select-title__
    margin-left: auto
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis

.__sun-design-select-item__
    // 

.__sun-design-select-description__
    text-align: end
    flex: 1
    color: var(--color-active-disabled)
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
    
.__sun-design-select-empty__
    text-align: start
    flex: 1
    color: var(--color-active-disabled)
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis

</style>