<template>
    <div style="padding: 50px;">
        <div style="padding: 10px; background-color: white; display: flex; gap: 6px; align-items: center;">
            <h4>Buttons</h4>
            <SunButton size="small" equal-padding squared>
                <Undo2 />
            </SunButton>
            <SunButton size="small">
                <X />小按钮
            </SunButton>
            <SunButton size="small" disabled />
            <SunButton size="normal" :color-scheme="ColorSchemeBlue">
                <Globe />确认按钮
            </SunButton>
            <SunButton size="normal" :color-scheme="ColorSchemeRed">取消</SunButton>
            <SunButton size="large" equal-padding squared>
                <Trash2 />
            </SunButton>
            <SunButton size="normal" flat>Flat</SunButton>
            <SunButton size="normal" flat disabled>Flat disabled</SunButton>
            <SunButton size="normal" flat active>Flat active</SunButton>
            <SunButton size="normal" flat active disabled>Flat disabled active</SunButton>
        </div>
        <div style="padding: 10px; background-color: white; display: flex; gap: 6px; align-items: center;">
            <h4>Inputs</h4>
            <SunLineEdit size="small" />
            <div style="display: flex; flex-direction: row; align-items: center; gap: 3px;">
                <!-- style="min-width: 42px;" -->
                <SunLabel>长度1</SunLabel>
                <SunLineEdit />
            </div>
            <SunLineEdit size="large" disabled />
            <SunCheckBox />
        </div>
    </div>
</template>

<script setup lang="ts">

import { Globe, Undo2, Search, Trash2, X } from 'lucide-vue-next';
import SunButton from './button/SunButton.vue';
import SunLineEdit from './lineedit/SunLineEdit.vue';
import SunCheckBox from './checkbox/SunCheckBox.vue';
import SunLabel from './label/SunLabel.vue';
import { ColorSchemeRed, ColorSchemeBlue } from './SunDesignConstants';

</script>

<style lang="stylus">
</style>