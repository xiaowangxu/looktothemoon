import { computed, markRaw, readonly, ref, shallowRef } from "vue";
import type { Item } from "../SunDesignConstants";

export type ColorData = [r: number, g: number, b: number, a: number];
export type PlainColorData = [r: number, g: number, b: number];

type ColorEditFormat = 'RGB' | 'HSL' | 'HSV';
type WheelEditFormat = 'OKHSV' | 'HSV';

const EditFormat = ref<ColorEditFormat>('RGB');
const EditFormats: Item<ColorEditFormat>[][] = markRaw([[{ uid: 'RGB', label: 'RGB' }, { uid: 'HSL', label: 'HSL' }, { uid: 'HSV', label: 'HSV' }]]);

const CodeFormat = ref(0);

const WheelEditFormat = ref<WheelEditFormat>('HSV');
const WheelEditFormats: Item<WheelEditFormat>[][] = markRaw([[{ uid: 'OKHSV', label: 'OkHSV' }, { uid: 'HSV', label: 'HSV' }]]);

const EditPropsR = computed(() => {
    switch (EditFormat.value) {
        case 'RGB': return { suffix: '红', min: 0, max: 255, step: 1, valueSnapGap: 1 };
        case 'HSL': case 'HSV': return { suffix: '色相 °', min: 0, max: 360, step: 1, valueSnapGap: 0.1, displayPercision: 1, displayRemoveTailingZeros: true };
    }
});
const EditPropsG = computed(() => {
    switch (EditFormat.value) {
        case 'RGB': return { suffix: '绿', min: 0, max: 255, step: 1, valueSnapGap: 1 };
        case 'HSL': case 'HSV': return { suffix: '饱和度 %', min: 0, max: 100, step: 1, valueSnapGap: 0.01, displayPercision: 2, displayRemoveTailingZeros: true };
    }
});
const EditPropsB = computed(() => {
    switch (EditFormat.value) {
        case 'RGB': return { suffix: '蓝', min: 0, max: 255, step: 1, valueSnapGap: 1 };
        case 'HSL': return { suffix: '亮度 %', min: 0, max: 100, step: 1, valueSnapGap: 0.01, displayPercision: 2, displayRemoveTailingZeros: true };
        case 'HSV': return { suffix: '明度 %', min: 0, max: 100, step: 1, valueSnapGap: 0.01, displayPercision: 2, displayRemoveTailingZeros: true };
    }
});
const EditPropsA = { suffix: '不透明度', min: 0, max: 255, step: 1, valueSnapGap: 1 };

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
        // wheel
        wheel_format: WheelEditFormat,
        wheel_formats: WheelEditFormats,
        // edit
        edit_format: EditFormat,
        edit_formats: EditFormats,

        edit_props_r: EditPropsR,
        edit_props_g: EditPropsG,
        edit_props_b: EditPropsB,
        edit_props_a: EditPropsA,
        // code
        code_format: CodeFormat,
        // library
        recent_folded: RecentFolded,
        recent_colors: readonly(RecentColorDatas),
        addRecentColor: addRecentColor,
    }
}