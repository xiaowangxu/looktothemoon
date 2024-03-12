<template>
    <SunButtonLike class="__sun-design-multiedit-container__" no-pressed-color align="start">
        <span class="__sun-design-multiedit-input__" contenteditable>123</span>
        <span>年</span>
        <span class="__sun-design-multiedit-input__" contenteditable>123</span>
        <span>月</span>
        <span class="__sun-design-multiedit-input__" contenteditable>123</span>
        <span>日</span>
    </SunButtonLike>
</template>

<script setup lang="ts">

import SunButtonLike from '../button/SunButtonLike.vue';

</script>

<style lang="stylus">

.__sun-design-multiedit-container__
    overflow: hidden
    display: block !important

.__sun-design-multiedit-input__
    display: inline-block
    border: none
    outline: none
    min-width: 10px

</style>