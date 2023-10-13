import { defineComponent, type PropType, ref, computed, withDirectives, watch } from "vue";
import SFlow from "@/components/SFlow.vue";
import SButton from "@/components/SButton.vue";
import SItem from "@/components/SItem.vue";
import SPopup from "@/components/SPopup.vue";
import SPanel from "@/components/SPanel.vue";
import SScrollContainer from "@/components/SScrollContainer.vue";
import { ChevronDown, ChevronUp } from "lucide-vue-next";
import { useComponentRefFocusBlur, type LabelTypes, vFocus, type Position, type Rect, type BoxSize } from "../SConst";
import './SSelectStyle.css';
import SLabelVue from "../Typography/SLabel.vue";

export default defineComponent({
    name: 'SSelect',
    props: {
        value: {
            type: [Number, String, Boolean, BigInt, Symbol] as PropType<LabelTypes>,
        },
        deselectable: {
            type: Boolean,
            required: false,
            default: false,
        },
        color: {
            type: String,
            required: false,
            default: 'var(--ThemeDisabledBaseColor)',
        },
        disabled: {
            type: Boolean,
            required: false,
        },
        focusItemOnOpen: {
            type: Boolean,
            required: false,
            default: true,
        },
    },
    emits: {
        'update:value': (value: LabelTypes) => true,
    },
    setup(props, { emit, expose }) {
        const opened = ref<boolean>(false);
        const sbutton_ref = ref<InstanceType<typeof SButton> | null>();
        const sscrollcontainer_ref = ref<InstanceType<typeof SScrollContainer> | null>();
        const { focus, blur } = useComponentRefFocusBlur(sbutton_ref);
        const button_rect = ref<Rect | undefined>();
        const content_size = ref<BoxSize | undefined>();
        expose({
            opened,
            buttonElement: computed(() => sbutton_ref.value?.buttonElement),
            focus, blur,
        });
        function on_ItemClicked(label: LabelTypes) {
            if (label === props.value) {
                if (props.deselectable) {
                    on_SelectClicked();
                    emit('update:value', undefined);
                }
            }
            else {
                on_SelectClicked();
                emit('update:value', label);
            }
        }
        function on_SelectClicked() {
            opened.value = !opened.value;
            if (opened.value === false) {
                sbutton_ref.value?.focus();
            }
        }
        function close() {
            opened.value = false;
        }
        watch(opened, (newval) => {
            if (newval) {
                const { left, top, width, height } = sbutton_ref.value?.buttonElement!.getClientRects()[0]!;
                button_rect.value = {
                    x: left,
                    y: top,
                    width,
                    height,
                };
            }
            else {
                content_size.value = undefined;
            }
        });
        watch(sscrollcontainer_ref, (container) => {
            if (!container) return;
            const { width, height } = container?.contentDomElement?.getBoundingClientRect()!;
            content_size.value = {
                width: width, height: height,
            };
        });
        const popup_rect = computed<Rect | undefined>(() => {
            if (content_size.value === undefined || button_rect.value === undefined) return undefined;
            return {
                x: button_rect.value.x,
                y: button_rect.value.y + button_rect.value.height,
                width: Math.max(content_size.value.width, button_rect.value.width),
                height: content_size.value.height,
            };
        });
        return {
            opened, popup_rect,
            sbutton_ref, sscrollcontainer_ref,
            on_SelectClicked, on_ItemClicked,
            focus, blur, close,
        };
    },
    render() {
        const { $slots, $attrs, opened, popup_rect, close, on_ItemClicked, on_SelectClicked } = this;
        const { value: prop_value, color: prop_color, disabled: prop_disabled, focusItemOnOpen: prop_focus_item_on_open } = this.$props;
        const { default: items_render } = $slots;
        const items = items_render?.({ close }) ?? [];
        let active_item = <>无</>;
        let active_color = prop_color;
        const buttons = items.map(i => {
            if (i.type === SItem) {
                const { label, color = prop_color, disabled } = i.props!;
                const active = label === prop_value;
                if (active) {
                    active_item = (i.children as any).default?.();
                    active_color = color;
                }
                const btn = <SButton iconOnly={true} flat={true} active={active} color={color} {...{ disabled: disabled }}
                    style="width: 100%; min-width: unset; border-radius: var(--SquareRadius);" key={label} onClick={() => on_ItemClicked(label)}>{i}</SButton>;
                return prop_focus_item_on_open && active ? withDirectives(btn, [[vFocus]]) : btn;
            }
            else return i;
        });
        return <>
            <SButton ref="sbutton_ref" class={{ '__s_select__': true, 'opened': opened }} style="padding-right: var(--NormalPaddingSize); overflow: hidden; min-width: unset;" color={active_color}
                {...{ disabled: prop_disabled, ...$attrs }} onClick={on_SelectClicked}>
                <SFlow style="flex: 1; color: inherit; overflow: hidden;" gap="var(--NormalPaddingSize)" alignV="center">
                    {active_item}
                </SFlow>
                {
                    opened ?
                        ($slots['icon-opened']?.() ?? <ChevronUp />) :
                        ($slots['icon-closed']?.() ?? <ChevronDown />)
                }
            </SButton>
            {
                opened &&
                <SPopup visible={popup_rect !== undefined} rect={popup_rect}>
                    <SPanel class="__s_select_panel__" style={{
                        width: popup_rect === undefined ? undefined : `${popup_rect.width}px`,
                        height: popup_rect === undefined ? undefined : `${popup_rect.height}px`,
                    }}>
                        <SScrollContainer ref="sscrollcontainer_ref" width="100%" maxWidth="100%">
                            <SFlow gap="var(--FocusOutlineWidth)" padding="var(--GapAndMargin)" vertical>
                                {buttons}
                            </SFlow>
                        </SScrollContainer>
                    </SPanel>
                </SPopup>
            }
        </>;
    }
});