<template>
    <SFakeCheckBox v-if="fake_checkbox.is" :value="fake_checkbox.active" :disabled="fake_checkbox.disbaled"
        :color="color" />
    <SFakeRadioBox v-else-if="fake_radiobox.is" :value="fake_radiobox.active" :disabled="fake_radiobox.disbaled"
        :color="color" />
    <component v-else :is="icon" :color="color" class="__s_icon__" />
</template>

<script setup lang="ts">

import { computed } from 'vue';
import * as icons from "lucide-vue-next";
import SFakeCheckBox from './SFakeCheckBox.vue';
import SFakeRadioBox from './SFakeRadioBox.vue';

// props
const props = defineProps<{
    name: string | 'FakeCheckBox' | 'FakeCheckBoxActive' | 'FakeCheckBoxDisabled' | 'FakeCheckBoxActiveDisabled'
    | 'FakeRadioBox' | 'FakeRadioBoxActive' | 'FakeRadioBoxDisabled' | 'FakeRadioBoxActiveDisabled',
    color?: string,
}>();

// data
const icon = computed(() => (icons as any)[props.name] as string);
const fake_checkbox = computed(() => {
    const name = props.name;
    const is_fake_checkbox = name === 'FakeCheckBox' || name === 'FakeCheckBoxActive' || name === 'FakeCheckBoxDisabled' || name === 'FakeCheckBoxActiveDisabled';
    return is_fake_checkbox ? {
        is: true,
        active: name === 'FakeCheckBoxActive' || name === 'FakeCheckBoxActiveDisabled',
        disbaled: name === 'FakeCheckBoxDisabled' || name === 'FakeCheckBoxActiveDisabled',
    } : { is: false };
});
const fake_radiobox = computed(() => {
    const name = props.name;
    const is_fake_radiobox = name === 'FakeRadioBox' || name === 'FakeRadioBoxActive' || name === 'FakeRadioBoxDisabled' || name === 'FakeRadioBoxActiveDisabled';
    return is_fake_radiobox ? {
        is: true,
        active: name === 'FakeRadioBoxActive' || name === 'FakeRadioBoxActiveDisabled',
        disbaled: name === 'FakeRadioBoxDisabled' || name === 'FakeRadioBoxActiveDisabled',
    } : { is: false };
});

</script>

