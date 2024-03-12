<template>
    <SunButton ref="button_ref" class="__sun-design-buttonpopup-button__" :class="{ active: opened && openActive }"
        :size="size" :flat="flat" :active="active" :disabled="disabled" :borderMask="borderMask" :hover="hover"
        :colorScheme="colorScheme" :squared="squared" @click="opened = !opened" v-bind="$attrs"
        @keydown.tab="onFocusChange">
        <slot :opened="opened" :toggle="toggle">
            <Menu />
        </slot>
    </SunButton>
    <SunMenuPopup ref="menupopup_ref" :mode="mode" :visible="opened" :size="size" :options="options"
        :preferedDirection="preferedDirection" :getPopupRect="getPopupPanelRect" :stop-events="stopEvents"
        :check-passive-click-outside="checkPassiveClickOutside" @clickOutside="onCoverClick"
        @trap-focus-out="onTrapFocusOut" @click="onClick">
    </SunMenuPopup>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunButton from '../button/SunButton.vue';
import SunMenuPopup, { type MenuItem } from '../menupopup/SunMenuPopup.vue';
import { Menu } from 'lucide-vue-next';
import { type Size, type BorderMask, type ColorScheme, type Rect, type BoxSize, type PopupOpenMode, calcButtonPopupRect, TrapFocusOutEvent, type PreferedDirection } from '../SunDesignConstants';
import { nextTick, ref, watch } from 'vue';

defineOptions({
    inheritAttrs: false,
});

// props
const props = withDefaults(
    defineProps<{
        options: MenuItem[][],
        mode?: PopupOpenMode,
        preferedDirection?: PreferedDirection,
        minWidth?: number,
        maxWidth?: number,
        stopEvents?: boolean,
        checkPassiveClickOutside?: boolean,
        // button
        size?: Size,
        flat?: boolean,
        hover?: boolean,
        active?: boolean,
        disabled?: boolean,
        borderMask?: BorderMask,
        colorScheme?: ColorScheme,
        squared?: boolean,
        // panel
        openActive?: boolean,
        offset?: number,
    }>(),
    {
        minWidth: 180,
        maxWidth: 460,
        stopEvents: true,
        checkPassiveClickOutside: false,
        mode: 'instance',
        preferedDirection: 0,
        openActive: true,
    }
);

// slots
defineSlots<{
    default(props: { opened: boolean, toggle: (open: boolean) => void }): void;
}>();

// emits
const emits = defineEmits<{
    (event: 'click', data: any, hasSubMenu: boolean, evt: Event): void,
    (event: 'opened'): void,
    (event: 'closed'): void,
}>();

// datas
const opened = ref(false);
const button_ref = ref<InstanceType<typeof SunButton> | undefined>();
const menupopup_ref = ref<InstanceType<typeof SunMenuPopup> | undefined>();
const emit_opened = () => emits('opened');
watch(opened, (opened) => {
    if (opened) {
        // emits open event after rendered flush
        nextTick(emit_opened);
    }
    else {
        // grab focus
        button_ref.value?.button?.focus();
        // emites close event before render update
        emits('closed');
    }
});

function getPopupPanelRect(contentMinSize: BoxSize, preferedDirection: PreferedDirection, windowSize: BoxSize): { rect: Rect, direction: PreferedDirection } {
    const { x, y, width, height } = (button_ref.value?.button as HTMLButtonElement)?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
    return { rect: calcButtonPopupRect({ x, y, width, height }, contentMinSize, windowSize, preferedDirection, 0, props.offset), direction: preferedDirection };
}

function toggle(open: boolean) {
    opened.value = open;
}

function onClick(data: any, hasSubMenu: boolean, evt: Event) {
    emits('click', data, hasSubMenu, evt);
    toggle(false);
}

function onCoverClick(evt: Event) {
    toggle(false);
}

function onTrapFocusOut(evt: TrapFocusOutEvent) {
    if (button_ref.value?.button) {
        evt.preventDefault();
        button_ref.value.button.focus();
    }
}

function onFocusChange(evt: KeyboardEvent) {
    if (opened.value) {
        evt.preventDefault();
        if (evt.shiftKey) {
            menupopup_ref.value?.focusLast();
        }
        else {
            menupopup_ref.value?.focusFirst();
        }
    }
}

// exposes
defineExpose({
    toggle,
    button: button_ref,
});

</script>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';
</style>