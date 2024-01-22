<template>
    <SunButton v-bind="$attrs">
    </SunButton>
    <component :is="props.render" :id="1" />
    <component :is="props.render" :id="2" />
</template>

<script setup lang="tsx">

import { computed, type Component, type Raw } from 'vue';
import SunButton from '../button/SunButton.vue';

// props
const props = defineProps<{
    render: Raw<Component<{ id: number }>>
}>();

console.log(props);

</script>