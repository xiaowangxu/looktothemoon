import { computed, markRaw, readonly, ref, shallowRef } from "vue";
import type { Item } from "../SunDesignConstants";

export type ColorData = [r: number, g: number, b: number, a: number];
export type PlainColorData = [r: number, g: number, b: number];

type ColorEditFormat = 'RGB' | 'HSL';

const EditFormat = ref<ColorEditFormat>('RGB');
const CodeFormat = ref(0);

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
const EditPropsR = computed(() => {
    switch (EditFormat.value) {
        case 'RGB': return { min: 0, max: 255, step: 1, valueSnapGap: 1 };
        case 'HSL': return { min: 0, max: 360, step: 1, valueSnapGap: 1 };
    }
});
const EditPropsG = computed(() => {
    switch (EditFormat.value) {
        case 'RGB': return { min: 0, max: 255, step: 1, valueSnapGap: 1 };
        case 'HSL': return { min: 0, max: 100, step: 1, valueSnapGap: 0.01, displayPrecision: 2 };
    }
});
const EditPropsB = computed(() => {
    switch (EditFormat.value) {
        case 'RGB': return { min: 0, max: 255, step: 1, valueSnapGap: 1 };
        case 'HSL': return { min: 0, max: 100, step: 1, valueSnapGap: 0.01, displayPrecision: 2 };
    }
});

// library
const MaxRecentCount = 16;
const RecentFolded = ref(false);
const RecentColorDatas = shallowRef<ColorData[]>([]);
function addRecentColor(color: ColorData) {
    const [r, g, b, a] = color;
    const filter = RecentColorDatas.value.filter(c => c[0] !== r || c[1] !== g || c[2] !== b || c[3] !== a);
    const colors: ColorData[] = [markRaw([r, g, b, a]), ...filter];
    if (colors.length > MaxRecentCount) colors.pop();
    RecentColorDatas.value = colors;
}

export function useColorPickerData() {
    return {
        edit_format: EditFormat,
        edit_formats: EditFormats,
        edit_label_r: EditLabelR, edit_props_r: EditPropsR,
        edit_label_g: EditLabelG, edit_props_g: EditPropsG,
        edit_label_b: EditLabelB, edit_props_b: EditPropsB,
        edit_label_a: EditLabelA,
        code_format: CodeFormat,
        recent_colors: readonly(RecentColorDatas),
        addRecentColor: addRecentColor,
        recent_folded: RecentFolded,
    }
}