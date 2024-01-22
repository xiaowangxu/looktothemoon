import { computed, readonly, ref } from "vue";
import type { Item } from "../SunDesignConstants";

type ColorEditFormat = 'RGB' | 'HSL';

const EditFormat = ref<ColorEditFormat>('RGB');
const CodeFormat = ref(true);
const Library = ref(20);

const EditFormats: Item<ColorEditFormat>[][] = [[
    {
        label: 'RGB',
        uid: 'RGB',
    },
    {
        label: 'HSL',
        uid: 'HSL'
    }
]];

const EditLabelR = computed(() => {
    switch (EditFormat.value) {
        case 'RGB': return '红';
        case 'HSL': return '色相';
    }
});
const EditLabelG = computed(() => {
    switch (EditFormat.value) {
        case 'RGB': return '绿';
        case 'HSL': return '饱和度';
    }
});
const EditLabelB = computed(() => {
    switch (EditFormat.value) {
        case 'RGB': return '蓝';
        case 'HSL': return '亮度';
    }
});
const EditLabelA = ref('不透明度');

export function useColorPickerData() {
    return {
        edit_format: EditFormat,
        edit_formats: EditFormats,
        edit_label_r: EditLabelR,
        edit_label_g: EditLabelG,
        edit_label_b: EditLabelB,
        edit_label_a: EditLabelA,
        code_format: CodeFormat,
        library: Library,
    }
}