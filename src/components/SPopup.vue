<template>
    <Teleport to="#popup">
        <div v-show="visible" class="__s__ __s_popup_cover__">
            <div class="__s__ __s_popup_container__">
                <slot />
            </div>
            <div ></div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">

import { onMounted, ref } from 'vue';

// props
const props = withDefaults(
    defineProps<{
        visible?: boolean
    }>(),
    {
        visible: true,
    }
);

// datas

// methods

</script>

<style>
.__s_popup_cover__ {
    /* outline: 5px solid red;
    outline-offset: -5px; */
    pointer-events: none;
    position: fixed;
    inset: 0px;
}

.__s_popup_container__ {
    position: absolute;
    left: 300px;
    width: 200px;
    top: 100px;
    height: 200px;
}
</style>