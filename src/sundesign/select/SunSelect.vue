<template>
    <SunButtonPopup ref="buttonpopup_ref" class="__sun-design-select-button__" :mode="mode" :get-popup-rect="getPopupRect"
        :active="active" :disabled="disabled" :size="size" :flat="flat" :border-mask="borderMask" :bordered="bordered"
        :squared="squared" drop-shadow :color-scheme="selected?.colorScheme ?? colorScheme" vertical scrollable-indicators
        width="100%" @opened="onOpened">
        <template #button="{ opened }">
            <template v-if="!iconOnly">
                <template v-if="selected !== undefined">
                    <SunButtonItem :item="selected" hide-shortcut hide-sub />
                </template>
                <template v-else>
                    <slot name="empty">
                        <span class="__sun-design-select-empty__">
                            无选中项
                        </span>
                    </slot>
                </template>
            </template>
            <slot v-if="!opened" name="closed">
                <ChevronDown />
            </slot>
            <slot v-else name="opened">
                <ChevronUp />
            </slot>
        </template>
        <template #popup>
            <template v-for="option in options">
                <SunPanelContainer vertical style="width: 100%;">
                    <template v-for="item in option">
                        <SunButton class="__sun-design-select-item__" :size="size"
                            :ref="(value !== undefined && item.uid === value) ? 'item_refs' : undefined"
                            :active="(value !== undefined && item.uid === value) || item?.active" flat
                            :disabled="item?.disabled" :color-scheme="item?.colorScheme" @click="onClick(item.uid, $event)">
                            <SunButtonItem :item="item" />
                        </SunButton>
                    </template>
                </SunPanelContainer>
                <SunPanelSeparator :override-vertical="true" />
            </template>
        </template>
    </SunButtonPopup>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunButtonPopup from '../buttonpopup/SunButtonPopup.vue';
import { type Size, type Item, type BorderMask, type ColorScheme, type UID, type Rect, type BoxSize, type PopupOpenMode, calcButtonPopupRect } from '../SunDesignConstants';
import SunButton from '../button/SunButton.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { computed, nextTick, ref } from 'vue';
import SunPanelSeparator from '../panel/SunPanelSeparator.vue';
import SunPanelContainer from '../panel/SunPanelContainer.vue';
import { useVModel } from '@vueuse/core';

// props
const props = withDefaults(
    defineProps<{
        mode?: PopupOpenMode,
        size?: Size,
        flat?: boolean,
        bordered?: boolean,
        borderMask?: BorderMask,
        colorScheme?: ColorScheme,
        squared?: boolean,
        options: Item[][],
        modelValue: UID | undefined,
        active?: boolean,
        disabled?: boolean,
        preferedDirection?: 0 | 1,
        allowDeselect?: boolean,
        iconOnly?: boolean,
    }>(),
    {
        mode: 'instance',
        size: 'normal',
        flat: false,
        squared: false,
        bordered: true,
        borderMask: 15,
        active: false,
        disabled: false,
        preferedDirection: 0,
        allowDeselect: false,
        iconOnly: false,
    }
);

// emits
const emits = defineEmits<{
    (event: 'update:modelValue', uid: UID | undefined): void
}>();

const value = useVModel(props, "modelValue", emits, { defaultValue: undefined });

// datas
const buttonpopup_ref = ref<InstanceType<typeof SunButtonPopup> | undefined>();
const item_refs = ref<InstanceType<typeof SunButton>[] | undefined>();
const selected = computed(() => {
    const uid = value.value;
    if (uid === undefined) return undefined;
    return props.options.flat().find(s => s.uid === uid);
});

// methods
function onClick(uid: UID, event: InputEvent) {
    if (value.value === uid) {
        if (props.allowDeselect) {
            value.value = undefined;
        }
    }
    else {
        value.value = uid;
    }
    buttonpopup_ref.value?.toggle(false);
}

function getPopupRect(buttonRect: Rect, contentMinSize: BoxSize, windowSize: BoxSize): Rect {
    const offset = 3; // buttonRect.height * 0.1;
    return calcButtonPopupRect(buttonRect, contentMinSize, windowSize, props.preferedDirection, offset);
}

const focus_selected_item = () => {
    item_refs.value?.[0]?.button?.focus();
};

function onOpened() {
    if (props.mode === 'instance') {
        nextTick(focus_selected_item);
    }
    else {
        focus_selected_item();
    }
}

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design-select-item__
    // 
    
.__sun-design-select-empty__
    text-align: start
    flex: 1
    color: var(--placeholder-color)
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis

    :disabled > &, .disabled > &
        color: var(--placeholder-color-disabled)

</style>