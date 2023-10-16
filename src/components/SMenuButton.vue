<template>
    <SButton ref="sbutton_ref" class="__s_itembutton__" :class="{ subitem: subItemIcon }" square flat :color="color" :active="active"
        :disabled="disabled" icon-size="normal">
        <slot name="icon" />
        <SLabel min-size="unset" color="inherit">{{ label }}</SLabel>
        <SLabel v-if="description !== undefined" min-size="unset" color="inherit"
            style="flex: 1; opacity: var(--DescriptionOpacity);" align-h="end">
            {{ description }}
        </SLabel>
        <ChevronRight v-if="subItemIcon" class="__s_icon__ __s_itembutton_subitemicon__"  />
    </SButton>
</template>

<script setup lang="ts">

import SButton from './SButton.vue';
import { computed, ref } from 'vue';
import { useComponentRefFocusBlur } from './SConst';
import { ChevronRight } from 'lucide-vue-next';
import SLabel from './Typography/SLabel.vue';

// props
const props = withDefaults(
    defineProps<{
        label?: string,
        description?: string,
        color?: string,
        active?: boolean,
        disabled?: boolean,
        subItemIcon?: boolean,
    }>(),
    {
        label: '',
        disabled: false,
        subItemIcon: false,
    }
);

// datas
const sbutton_ref = ref<InstanceType<typeof SButton>>();
const { focus, blur } = useComponentRefFocusBlur<typeof SButton>(sbutton_ref);

// exposes
defineExpose({
    buttonElement: computed(() => sbutton_ref.value?.buttonElement),
    focus, blur,
})

</script>

<style>
.__s_itembutton__ {
    width: 100%;
}

.__s_itembutton__.subitem {
    padding-right: var(--NormalPaddingSize);
}

.__s_itembutton_subitemicon__ {
    margin-left: auto;
}
</style>