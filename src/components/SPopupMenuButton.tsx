import { type PropType, defineComponent, ref } from "vue";
import SPopupMenu from "@/components/SPopupMenu";
import SButton from "@/components/SButton.vue";
import type { BoxSize, PopupOpenMode, Rect } from "./SConst";

export default defineComponent({
    name: 'SPopupMenuButton',
    props: {
        openMode: {
            type: String as PropType<PopupOpenMode>,
            required: false,
            default: 'instance',
        },
        subOpenMode: {
            type: String as PropType<PopupOpenMode>,
            required: false,
            default: 'instance',
        },
        minWidth: {
            type: String,
            required: false,
            default: '200px',
        }
    },
    setup(props, ctx) {
        const opened = ref<boolean>(false);
        const sbutton_ref = ref<InstanceType<typeof SButton>>();
        function get_PopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect | undefined {
            if (!sbutton_ref.value?.buttonElement) return undefined;
            const { left, top, bottom, width, height } = sbutton_ref.value.buttonElement.getBoundingClientRect();
            return { x: left, y: bottom, ...contentMinSize };
        }
        function on_ButtonClick() {
            opened.value = !opened.value;
        }
        return {
            opened,
            sbutton_ref,
            get_PopupRect, on_ButtonClick,
        };
    },
    render() {
        const { opened, get_PopupRect, on_ButtonClick } = this;
        const { minWidth, openMode, subOpenMode } = this.$props;
        const { items, button } = this.$slots;
        return <>
            <SButton ref="sbutton_ref" flat onClick={on_ButtonClick}>
                {button?.()}
            </SButton>
            <SPopupMenu open={opened} minWidth={minWidth} openMode={openMode} subOpenMode={subOpenMode} getPopupRect={get_PopupRect}>
                {{
                    default: () => items?.(),
                }}
            </SPopupMenu >
        </>;
    },
});