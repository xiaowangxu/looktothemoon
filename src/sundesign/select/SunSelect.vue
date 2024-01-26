<template>
    <SunButtonPopup ref="buttonpopup_ref" class="__sun-design-select-button__" :mode="mode" :get-popup-rect="getPopupRect"
        :active="active" :disabled="disabled" :size="size" :flat="flat" :border-mask="borderMask" :bordered="bordered"
        :squared="squared" drop-shadow :color-scheme="selected?.colorScheme ?? colorScheme" vertical scrollable-indicators
        content-style="width: 100%;" @opened="onOpened">
        <template #button="{ opened }">
            <template v-if="!iconOnly">
                <template v-if="selected !== undefined">
                    <template v-if="(selected as RenderSelectItem).renderButtonContent === undefined">
                        <SunButtonItem :label="(selected as ItemSelectItem).label" :icon="(selected as ItemSelectItem).icon"
                            :description="(selected as ItemSelectItem).description" />
                    </template>
                    <template v-else>
                        <component :is="(selected as RenderSelectItem).renderButtonContent" :uid="selected.uid" />
                    </template>
                </template>
                <template v-else>
                    <slot name="button-empty">
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
            <template v-if="options !== undefined && options.length > 0" v-for="option, idx in options">
                <SunPanelContainer vertical style="width: 100%;">
                    <template v-for="item in option">
                        <template v-if="(item as RenderSelectItem).render === undefined">
                            <SunButton class="__sun-design-select-item__" :size="size"
                                :ref="(value !== undefined && item.uid === value) ? 'item_refs' : undefined"
                                :active="(value !== undefined && item.uid === value) || (item as ItemSelectItem)?.active"
                                flat :disabled="(item as ItemSelectItem)?.disabled" :color-scheme="item?.colorScheme"
                                @click="onClick(item.uid, $event)" :key="item.uid">
                                <SunButtonItem :label="(item as ItemSelectItem).label"
                                    :icon="(item as ItemSelectItem).icon"
                                    :description="(item as ItemSelectItem).description"
                                    :shortcut="(item as ItemSelectItem).shortcut" />
                            </SunButton>
                        </template>
                        <template v-else>
                            <component :is="(item as RenderSelectItem).render" :uid="item.uid"
                                :selected="(value !== undefined && item.uid === value)" :click="onClick" :key="item.uid" />
                        </template>
                    </template>
                </SunPanelContainer>
                <SunPanelSeparator v-if="idx < options.length - 1" :override-vertical="true" :key="idx" />
            </template>
            <SunPanelContainer v-else vertical>
                <slot name="popup-empty">
                    <SunButtonLike flat no-hover-color no-pressed-color><span
                            style="color: var(--placeholder-color);">无内容</span></SunButtonLike>
                </slot>
            </SunPanelContainer>
        </template>
    </SunButtonPopup>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunButtonPopup from '../buttonpopup/SunButtonPopup.vue';
import { type Size, type Item, type BorderMask, type ColorScheme, type UID, type Rect, type BoxSize, type PopupOpenMode, calcButtonPopupRect, type PreferedDirection } from '../SunDesignConstants';
import SunButton from '../button/SunButton.vue';
import SunButtonItem from '../item/SunButtonItem.vue';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { computed, ref, type Raw, type Component } from 'vue';
import SunPanelSeparator from '../panel/SunPanelSeparator.vue';
import SunPanelContainer from '../panel/SunPanelContainer.vue';
import { useVModel } from '@vueuse/core';
import SunButtonLike from '../button/SunButtonLike.vue';

type ItemSelectItem<T extends UID = UID> = Omit<Item<T>, 'sub'>;
type RenderSelectItem<T extends UID = UID> = {
    uid: T,
    colorScheme?: ColorScheme,
    renderButtonContent: Raw<Component<{
        uid: T,
    }>>,
    render: Raw<Component<{
        uid: T,
        selected: boolean,
        click: (uid: T, evt: Event) => void,
    }>>,
};
export type SelectItem<T extends UID = UID> = ItemSelectItem<T> | RenderSelectItem<T>;

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
        options?: SelectItem[][],
        modelValue: UID | undefined,
        active?: boolean,
        disabled?: boolean,
        preferedDirection?: PreferedDirection,
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
    if (props.options === undefined) return undefined;
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
    focus_selected_item();
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