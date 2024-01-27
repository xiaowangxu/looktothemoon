<template>
    <SunButtonItem v-if="!editting" :label="label" :icon="icon" :description="description" :shortcut="shortcut" :sub="sub"
        :hideDescription="hideDescription" :hideShortcut="hideShortcut" :hideSub="hideSub" />
    <template v-else>
        <SunIcon v-if="icon !== undefined" :name="icon"></SunIcon>
        <form class="__sun-design-item-button-form__" @submit.prevent="onSubmit(($event.target as any).label.value)">
            <input ref="input_ref" class="__sun-design__ __sun-design-item-button-input__" name="label" placeholder="查找"
                @blur="onSubmit(($event.target as any).value)" :value="label ?? ''" />
        </form>
    </template>
</template>

<script setup lang="ts">

import '../SunDesignStyle.styl';
import SunIcon from '../icon/SunIcon.vue';
import SunButtonItem from './SunButtonItem.vue';
import { nextTick, ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        label?: string,
        icon?: string,
        description?: string,
        shortcut?: string,
        sub?: boolean,
        hideDescription?: boolean,
        hideShortcut?: boolean,
        hideSub?: boolean,
    }>(),
    {
        hideDescription: false,
        hideShortcut: false,
        hideSub: false,
    }
);

// datas
const editting = ref(false);
const input_ref = ref<HTMLInputElement | null>(null);
async function onEdit() {
    editting.value = true;
    await nextTick();
    input_ref.value?.focus();
    input_ref.value?.setSelectionRange(0, input_ref.value.value.length);
}
function onSubmit(label: string) {
    if (editting.value) {
        editting.value = false;
        if (label !== props.label) {
            console.log(label);
        }
    }
}

// exposes
defineExpose({
    edit: onEdit,
});

</script>

<style lang="stylus">

.__sun-design-item-button-form__
    flex: 1
    min-width: 0

.__sun-design-item-button-input__
    border: none
    width: 100%
    padding: 0
    background-color: transparent
    outline: none

</style>