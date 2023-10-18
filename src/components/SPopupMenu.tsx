import SMenuButton from '@/components/SMenuButton.vue';
import SAutoMeasurePopupPanel from '@/components/SAutoMeasurePopupPanel.vue';
import SFlow from '@/components/SFlow.vue';
import SItem from '@/components/SItem.vue';
import SButton from '@/components/SButton.vue';
import { defineComponent, ref, type PropType, watch, toRef } from 'vue';
import { timer, type BoxSize, type PopupOpenMode, type Rect, type TimerCanceller, calcPopupMenuPopupSize, clamp } from './SConst';

const SPopupMenu = defineComponent({
    name: 'SPopupMenu',
    props: {
        hideDuration: {
            type: Number,
            required: false,
            default: 600,
        },
        showDuration: {
            type: Number,
            required: false,
            default: 200,
        },
        hideOnLeave: {
            type: Boolean,
            required: false,
            default: false,
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
        getPopupRect: {
            type: Function as PropType<(contentMinSize: BoxSize, windowSize: BoxSize) => Rect | undefined>,
            required: true,
        },
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
        open: {
            type: Boolean,
            required: false,
            default: false,
        },
        preferedDirection: {
            type: Number as PropType<0 | 1>,
            required: false,
            default: 1,
        },
        isSubMenu: {
            type: Boolean,
            required: false,
            default: false,
        }
    },
    emits: ['opened', 'closed', 'mouseenter', 'click', 'clickoutside'],
    setup(props, { emit, expose }) {
        const hovered_subitem = ref<any>(undefined);
        const hovered_spopupmenu_ref = ref<InstanceType<typeof SPopupMenu> | null>(null);
        const spopuppanel_ref = ref<InstanceType<typeof SAutoMeasurePopupPanel> | null>(null);
        const hovered_sbutton_ref = ref<InstanceType<typeof SButton> | InstanceType<typeof SMenuButton> | null>(null);
        const prefered_direction = ref<0 | 1>(1);
        let hide_timer: TimerCanceller | undefined = undefined;
        let show_timer: TimerCanceller | undefined = undefined;
        watch(toRef(props, 'open'), (opened) => {
            if (!opened) {
                hovered_subitem.value = undefined;
                hide_timer?.();
                hide_timer = undefined;
                show_timer?.();
                show_timer = undefined;
                emit('closed');
            }
            else {
                emit('opened');
            }
        });
        function get_ClampedContentSize(contentMinSize: BoxSize): BoxSize {
            return { width: clamp(contentMinSize.width, props.minWidth, props.maxWidth), height: contentMinSize.height };
        }
        function getPopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect | undefined {
            return props.getPopupRect(get_ClampedContentSize(contentMinSize), windowSize);
        }
        function hover_SubItem(key: any, is_submenu: boolean) {
            if (is_submenu) {
                hide_timer?.();
                hide_timer = undefined;
                show_timer?.();
                if (hovered_subitem.value === key) {
                    show_timer = undefined;
                }
                else {
                    show_timer = timer(() => {
                        hovered_subitem.value = key;
                    }, props.showDuration);
                }
            }
            else {
                show_timer?.();
                show_timer = undefined;
                if (hide_timer === undefined && hovered_subitem.value !== undefined) {
                    hide_timer = timer(() => {
                        hovered_subitem.value = undefined;
                    }, props.hideDuration);
                }
            }
        }
        function leave_SubItem(key: any) {
            if (hovered_subitem.value === key) {
                hide_timer?.();
                hide_timer = timer(() => {
                    hovered_subitem.value = undefined;
                }, props.hideDuration);
            }
        }
        function get_HoveredSubItemPopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect | undefined {
            if (!hovered_sbutton_ref.value?.buttonElement) return undefined;
            const { left, right, top, bottom, width, height } = hovered_sbutton_ref.value.buttonElement.getBoundingClientRect();
            const { rect, direction } = calcPopupMenuPopupSize(get_ClampedContentSize(contentMinSize), { x: left, y: top, width, height }, windowSize, props.preferedDirection);
            prefered_direction.value = direction;
            return rect;
        }
        function on_PopupMenuEntered(event: Event) {
            emit('mouseenter', event);
        }
        function on_SubMenuPanelEntered(key: any) {
            if (hovered_subitem.value === key) {
                hide_timer?.();
                hide_timer = undefined;
            }
        }
        function on_ClickOutside(event: PointerEvent) {
            const path = event.composedPath();
            const ignore = get_SubPanelDivElements().some(t => path.includes(t));
            if (!ignore) {
                emit('clickoutside', event);
            }
        }
        function get_SubPanelDivElements() {
            if (!hovered_spopupmenu_ref.value) return [];
            return [
                hovered_spopupmenu_ref.value?.popupPanelComponent?.panelComponent?.divElement,
                ...hovered_spopupmenu_ref.value?.get_SubPanelDivElements?.() ?? []
            ].filter(i => i !== undefined);
        }
        function on_Click(label: any) {
            emit('click', label);
        }

        expose({
            get_SubPanelDivElements,
            popupPanelComponent: spopuppanel_ref,
        });

        return {
            hovered_subitem, hovered_sbutton_ref, prefered_direction, hovered_spopupmenu_ref, spopuppanel_ref,
            getPopupRect, on_Click, hover_SubItem, leave_SubItem, get_HoveredSubItemPopupRect, on_PopupMenuEntered, on_SubMenuPanelEntered, on_ClickOutside,
        };
    },
    render() {
        const { hovered_subitem, prefered_direction, getPopupRect, on_Click, hover_SubItem, leave_SubItem, get_HoveredSubItemPopupRect, on_PopupMenuEntered, on_SubMenuPanelEntered, on_ClickOutside } = this;
        const { isSubMenu: prop_is_submenu, minWidth: prop_min_width, maxWidth: prop_max_width, width: prop_width, open: prop_open, openMode: prop_open_mode, subOpenMode: prop_sub_open_mode, hideOnLeave: prop_hide_on_leave, hideDuration: prop_hide_duration, showDuration: pro_show_duration } = this.$props;
        const { default: items_render } = this.$slots;
        const items = items_render?.() ?? [];
        const sub_popupmenus: any[] = [];
        const buttons = items.map(i => {
            if (i.type === SItem) {
                const { label, color, active, disabled, description, uid } = i.props!;
                const is_disabled = disabled !== undefined && disabled !== false;
                const children = (i.children as any)?.default?.();
                const icon = (i.children as any)?.icon?.();
                const subitems = (i.children as any)?.subitems?.();
                const has_subitems = subitems !== undefined && subitems.length > 0;
                const key = uid ?? label;
                const is_hovered_subitems = hovered_subitem === key;
                const subitem_mouseentered = () => hover_SubItem(key, has_subitems && !is_disabled);
                const subitem_sbutton_ref = has_subitems && is_hovered_subitems ? 'hovered_sbutton_ref' : undefined;
                const item_mouseleaved = prop_hide_on_leave ? () => leave_SubItem(key) : undefined;
                const item_clicked = has_subitems ? undefined : () => on_Click(key);
                const btn = children === undefined ?
                    <SMenuButton ref={subitem_sbutton_ref} active={active} label={label} color={color} disabled={is_disabled} description={description} key={key} subItemIcon={has_subitems} onClick={item_clicked} onMouseenter={subitem_mouseentered} onMouseleave={item_mouseleaved}>
                        {{
                            icon: () => icon,
                        }}
                    </SMenuButton> :
                    <SButton ref={subitem_sbutton_ref} flat={true} square={true} active={active} color={color} disabled={is_disabled}
                        style="width: 100%;" key={key} onClick={item_clicked} onMouseenter={subitem_mouseentered} onMouseleave={item_mouseleaved}>{i}</SButton>;
                const sub_open_mode = prop_sub_open_mode ?? prop_open_mode;
                if (has_subitems && (prop_sub_open_mode !== 'instance' || is_hovered_subitems)) {
                    sub_popupmenus.push(
                        <SPopupMenu ref={is_hovered_subitems ? "hovered_spopupmenu_ref" : undefined} hideDuration={prop_hide_duration} showDuration={pro_show_duration} hideOnLeave={prop_hide_on_leave} isSubMenu={true} open={is_hovered_subitems} minWidth={prop_min_width} maxWidth={prop_max_width} width={prop_width} preferedDirection={prefered_direction} openMode={sub_open_mode} subOpenMode={sub_open_mode} key={`__${key}_popupmenu__`} getPopupRect={get_HoveredSubItemPopupRect} onClick={on_Click} onMouseenter={() => on_SubMenuPanelEntered(key)}>
                            {{
                                default: () => subitems,
                            }}
                        </SPopupMenu>
                    );
                }
                return btn;
            }
            else return i;
        });
        const click_outside = prop_is_submenu ? undefined : on_ClickOutside;
        return <>
            <SAutoMeasurePopupPanel ref="spopuppanel_ref" open={prop_open} openMode={prop_open_mode} getPopupRect={getPopupRect} onMouseenter={on_PopupMenuEntered} onClickoutside={prop_is_submenu ? undefined : click_outside}>
                <SFlow gap="var(--FocusOutlineWidth)" padding="var(--GapAndMargin)" vertical style={{ width: prop_width }}>
                    {buttons}
                </SFlow>
            </SAutoMeasurePopupPanel>
            {
                sub_popupmenus
            }
        </>;
    },
});

export default SPopupMenu;