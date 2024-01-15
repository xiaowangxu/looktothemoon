import { defineComponent, type PropType, ref, computed, watch, nextTick, type Ref, toRef } from "vue";
import SFlow from "@/components/SFlow.vue";
import SButton from "@/components/SButton.vue";
import SItem from "@/components/SItem.vue";
import SScrollContainer from "@/components/SScrollContainer.vue";
import SPopupPanel from '@/components/SPopupPanel.vue';
import { ChevronDown, ChevronUp } from "lucide-vue-next";
import { useComponentRefFocusBlur, usePopupPanelMeasureRect, type LabelTypes, type Rect, type BoxSize, type PopupOpenMode, calcSelectPopupSize } from "./SConst";
import { useWindowSize } from "@vueuse/core";
import SMenuButton from "@/components/SMenuButton.vue";
import SLabel from "@/components/typography/SLabel.vue";
import SIcon from "./SIcon.vue";

export default defineComponent({
    name: 'SSelect',
    props: {
        value: {
            type: [Number, String, Boolean, BigInt, Symbol, undefined, null] as PropType<LabelTypes>,
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
        useActiveColor: {
            type: Boolean,
            required: false,
            default: true,
        },
        openMode: {
            type: String as PropType<PopupOpenMode>,
            required: false,
            default: 'instance',
        }
    },
    emits: {
        'update:value': (value: LabelTypes) => true,
    },
    setup(props, { emit, expose }) {

        const opened = ref<boolean>(false);
        const active_item_ref = ref<InstanceType<typeof SButton> | InstanceType<typeof SMenuButton> | null>(null);
        const sbutton_ref = ref<InstanceType<typeof SButton> | null>(null);
        const sscrollcontainer_ref = ref<InstanceType<typeof SScrollContainer> | null>(null);
        const content_size = usePopupPanelMeasureRect(opened, computed(() => sscrollcontainer_ref.value?.contentDomElement), computed(() => props.openMode === 'instance'));
        const button_rect = ref<Rect | undefined>();
        const { width: window_width, height: window_height } = useWindowSize();

        const { focus, blur } = useComponentRefFocusBlur(sbutton_ref);
        function on_ItemClicked(label: LabelTypes, evt: InputEvent) {
            console.log(">!!!!!");
            console.log(">>>>", label, evt);
            if (label === props.value) {
                if (props.deselectable) {
                    evt.stopPropagation();
                    // on_SelectClicked();
                    // emit('update:value', undefined);
                }
            }
            else {
                evt.stopPropagation();
                // on_SelectClicked();
                // emit('update:value', label);
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

        // handle popuppanel open / close using popup_rect ref
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
                active_item_ref.value = null;
            }
        });
        const popup_rect = computed<Rect | undefined>(() => {
            if (content_size.value === undefined || button_rect.value === undefined) return undefined;
            const window_size: BoxSize = { width: window_width.value, height: window_height.value };
            return calcSelectPopupSize(content_size.value, button_rect.value, window_size);
        });
        function on_PopupPanelOpened() {
            if (props.focusItemOnOpen && active_item_ref.value) {
                nextTick(() => {
                    active_item_ref.value?.focus();
                });
            }
        }
        function on_ClickOutside(event: Event) {
            if (!sbutton_ref.value?.buttonElement) return;
            const target = sbutton_ref.value.buttonElement;
            const include_button = event.composedPath().includes(target);
            if (!include_button) {
                close();
            }
        }

        expose({
            opened,
            buttonElement: computed(() => sbutton_ref.value?.buttonElement),
            focus, blur, close,
        });

        return {
            opened, popup_rect, content_size,
            sbutton_ref, sscrollcontainer_ref, active_item_ref,
            on_SelectClicked, on_ItemClicked, on_PopupPanelOpened, on_ClickOutside,
            focus, blur, close,
        };
    },
    render() {
        const { $slots, $attrs, opened, popup_rect, close, on_ItemClicked, on_SelectClicked, on_PopupPanelOpened, on_ClickOutside } = this;
        const { value: prop_value, color: prop_color, disabled: prop_disabled, openMode: prop_open_mode, useActiveColor: prop_use_active_color } = this.$props;
        const { default: items_render } = $slots;

        const instance = prop_open_mode === 'visibility' || opened;
        const items = items_render?.({ close }) ?? [];
        let active_item = undefined;
        let active_color = prop_color;
        const buttons = items.map(i => {
            if (i.type === SItem) {
                const { label, color = prop_color, disabled, description, uid, icon: prop_icon } = i.props!;
                const is_disabled = disabled !== undefined && disabled !== false;
                const active = label === prop_value;
                const children = (i.children as any)?.default?.();
                const icon = (i.children as any)?.icon?.();
                const key = uid ?? label;
                if (active) {
                    active_item = (i.children as any)?.default?.() ?? <>
                        {icon ?? (prop_icon === undefined ? undefined : <SIcon name={prop_icon} />)}
                        <SLabel min-size="unset" color="inherit">{label}</SLabel>
                        {
                            description !== undefined && <SLabel min-size="unset" color="inherit" style="flex: 1; opacity: var(--DescriptionOpacity);" align-h="end">
                                {description}
                            </SLabel>
                        }
                    </>;
                    if (prop_use_active_color) active_color = color;
                }
                const btn = children === undefined ?
                    <SMenuButton ref={active ? 'active_item_ref' : undefined} active={active} label={label} icon={prop_icon} description={description} color={color} disabled={is_disabled} key={key} onClick={(evt: InputEvent) => on_ItemClicked(label, evt)} >
                        {{
                            icon: () => icon,
                        }}
                    </SMenuButton> :
                    <SButton ref={active ? 'active_item_ref' : undefined} flat={true} square={true} active={active} color={color} disabled={is_disabled}
                        style="width: 100%;" key={key} onClick={(evt: InputEvent) => on_ItemClicked(label, evt)}>{i}</SButton>;
                return btn;
            }
            else return i;
        });
        if (active_item === undefined) active_item = $slots.empty?.();

        return <>
            {/* SelectButton */}
            <SButton ref="sbutton_ref" class={{ '__s_select__': true, 'opened': opened }} style="padding-right: var(--NormalPaddingSize); overflow: hidden;" color={active_color} disabled={prop_disabled}
                {...$attrs} onClick={on_SelectClicked}>
                <SFlow style="flex: 1; color: inherit; overflow: hidden;" gap="var(--NormalPaddingSize)" alignV="center">
                    {active_item}
                </SFlow>
                {
                    opened ? ($slots['icon-opened']?.() ?? <ChevronUp />) : ($slots['icon-closed']?.() ?? <ChevronDown />)
                }
            </SButton>
            {/* PopupPanel */}
            {
                instance &&
                <SPopupPanel rect={popup_rect} onOpened={on_PopupPanelOpened} onClickoutside={on_ClickOutside}>
                    <SScrollContainer ref="sscrollcontainer_ref" width="100%" maxWidth="100%">
                        <SFlow gap="var(--FocusOutlineWidth)" padding="var(--GapAndMargin)" vertical>
                            {buttons}
                        </SFlow>
                    </SScrollContainer>
                </SPopupPanel>
            }
        </>;
    }
});