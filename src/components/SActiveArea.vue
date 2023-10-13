<template>
    <label class="__s__ __s_activearea__">
        <SFlow :vertical="vertical" :gap="gap" :align-h="alignH" :align-v="alignV">
            <slot />
        </SFlow>
    </label>
</template>

<script setup lang="ts">

import './SStyle.css';
import SFlow from './SFlow.vue';
import { type Alignment } from './SConst';

// props
const props = withDefaults(
    defineProps<{
        gap?: string,
        vertical?: boolean,
        alignH?: Alignment,
        alignV?: Alignment
    }>(),
    {
        gap: 'var(--GapAndMargin)',
        vertical: false,
        alignH: 'start',
        alignV: 'center',
    }
);

</script>

<style></style>