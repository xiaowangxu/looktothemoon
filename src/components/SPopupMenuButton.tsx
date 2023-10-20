import { type PropType, defineComponent, ref, computed, watch } from "vue";
import SPopupMenu from "@/components/SPopupMenu";
import SButton from "@/components/SButton.vue";
import { useComponentRefFocusBlur, type BoxSize, type PopupOpenMode, type Rect, calcPopupMenuPopupSize, clamp } from "./SConst";

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
            type: Number,
            required: false,
            default: 200,
        },
        maxWidth: {
            type: Number,
            required: false,
            default: 500,
        },
        width: {
            type: String,
            required: false,
            default: '100%',
        },
        preferedDirection: {
            type: Number as PropType<0 | 1>,
            required: false,
            default: 1,
        },
        allowShiftUp: {
            type: Boolean,
            required: false,
            default: false,
        },
        closeOnClick: {
            type: Boolean,
            required: false,
            default: true,
        },
        teleportDisabled: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    emits: ['opened', 'closed', 'mouseenter', 'mouseleave', 'click'],
    setup(props, { expose, emit }) {
        const opened = ref<boolean>(false);
        const sbutton_ref = ref<InstanceType<typeof SButton>>();
        const { focus, blur } = useComponentRefFocusBlur(sbutton_ref);
        watch(opened, (newval) => {
            if (newval) {
                emit('opened');
            }
            else {
                emit('closed');
            }
        });
        function get_PopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect | undefined {
            if (!sbutton_ref.value?.buttonElement) return undefined;
            const { left, bottom } = sbutton_ref.value.buttonElement.getBoundingClientRect();
            const clamped_content_size = { width: clamp(contentMinSize.width, props.minWidth, props.maxWidth), height: contentMinSize.height };
            return calcPopupMenuPopupSize(clamped_content_size, { x: left, y: bottom, width: 0, height: 0 }, windowSize, props.preferedDirection, { width: 0, height: 0 }, props.allowShiftUp).rect;
        }
        function on_ButtonClick() {
            opened.value = !opened.value;
        }
        function on_ButtonMouseEntered(event: Event) {
            emit('mouseenter', event);
        }
        function on_ButtonMouseLeaved(event: Event) {
            emit('mouseleave', event);
        }
        function on_Click(label: any) {
            emit('click', label);
            if (props.closeOnClick) {
                close();
            }
        }
        function on_Clickoutside(event: Event) {
            if (!sbutton_ref.value?.buttonElement) return;
            const target = sbutton_ref.value.buttonElement;
            const include_button = event.composedPath().includes(target);
            if (!include_button) {
                close();
            }
        }
        function open() { opened.value = true; }
        function close() { opened.value = false; }
        expose({
            buttonElement: computed(() => sbutton_ref.value?.buttonElement),
            open, close, focus, blur,
        });
        return {
            opened, open, close,
            sbutton_ref,
            get_PopupRect, on_Click, on_ButtonClick, on_ButtonMouseEntered, on_ButtonMouseLeaved, on_Clickoutside,
        };
    },
    render() {
        const { opened, open, close, get_PopupRect, on_Click, on_ButtonClick, on_ButtonMouseEntered, on_ButtonMouseLeaved, on_Clickoutside } = this;
        const { minWidth, maxWidth, width, openMode, subOpenMode, preferedDirection, teleportDisabled } = this.$props;
        const { items, button } = this.$slots;
        return <>
            <SButton ref="sbutton_ref" active={opened} flat onClick={on_ButtonClick} onMouseenter={on_ButtonMouseEntered} onMouseleave={on_ButtonMouseLeaved}>
                {button?.()}
            </SButton>
            <SPopupMenu open={opened} teleportDisabled={teleportDisabled} minWidth={minWidth} maxWidth={maxWidth} width={width} openMode={openMode} subOpenMode={subOpenMode} getPopupRect={get_PopupRect} onClickoutside={on_Clickoutside} preferedDirection={preferedDirection} onClick={on_Click}>
                {{
                    default: () => items?.({ open, close }),
                }}
            </SPopupMenu >
        </>;
    },
});