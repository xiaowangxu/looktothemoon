import SMenuButton from '@/components/SMenuButton.vue';
import SAutoMeasurePopupPanel from '@/components/SAutoMeasurePopupPanel.vue';
import SFlow from '@/components/SFlow.vue';
import SItem from '@/components/SItem.vue';
import SButton from '@/components/SButton.vue';
import { defineComponent, ref, type PropType, watch, toRef } from 'vue';
import type { BoxSize, PopupOpenMode, Rect } from './SConst';

const SPopupMenu = defineComponent({
    name: 'SPopupMenu',
    props: {
        minWidth: {
            type: String,
            required: false,
            default: '200px',
        },
        maxWidth: {
            type: String,
            required: false,
            default: '500px',
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
        }
    },
    setup(props, ctx) {
        const hovered_subitem = ref<any>(undefined);
        const hovered_sbutton_ref = ref<InstanceType<typeof SButton> | InstanceType<typeof SMenuButton> | null>(null);
        const prefered_direction = ref<0 | 1>(1);
        watch(toRef(props, 'open'), (opened) => {
            if (!opened) {
                hovered_subitem.value = undefined;
            }
        });
        function getPopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect | undefined {
            return props.getPopupRect(contentMinSize, windowSize);
        }
        function hover_SubItem(key: any) {
            hovered_subitem.value = key;
        }
        function get_HoveredSubItemPopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect | undefined {
            if (!hovered_sbutton_ref.value?.buttonElement) return undefined;
            const { left, right, top, bottom, width, height } = hovered_sbutton_ref.value.buttonElement.getBoundingClientRect();
            if (props.preferedDirection === 1) {
                return { x: right, y: top - 5, ...contentMinSize };
            }
            else {
                return { x: left - contentMinSize.width, y: top - 5, ...contentMinSize };
            }
        }
        return {
            hovered_subitem, hovered_sbutton_ref, prefered_direction,
            getPopupRect, hover_SubItem, get_HoveredSubItemPopupRect,
        };
    },
    render() {
        const { hovered_subitem, prefered_direction, getPopupRect, hover_SubItem, get_HoveredSubItemPopupRect } = this;
        const { minWidth: prop_min_width, maxWidth: prop_max_width, width: prop_width, open: prop_open, openMode: prop_open_mode, subOpenMode: prop_sub_open_mode } = this.$props;
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
                const subitem_mouseentered = has_subitems && !is_disabled ? () => hover_SubItem(key) : undefined;
                const subitem_sbutton_ref = has_subitems && is_hovered_subitems ? 'hovered_sbutton_ref' : undefined;
                const btn = children === undefined ?
                    <SMenuButton ref={subitem_sbutton_ref} active={active} label={label} color={color} disabled={is_disabled} description={description} key={key} subItemIcon={has_subitems} onMouseenter={subitem_mouseentered}>
                        {{
                            icon: () => icon,
                        }}
                    </SMenuButton> :
                    <SButton ref={subitem_sbutton_ref} flat={true} square={true} active={active} color={color} disabled={is_disabled}
                        style="width: 100%;" key={key} onMouseenter={subitem_mouseentered}>{i}</SButton>;
                const sub_open_mode = prop_sub_open_mode ?? prop_open_mode;
                if (has_subitems && (prop_sub_open_mode !== 'instance' || is_hovered_subitems)) {
                    sub_popupmenus.push(
                        <SPopupMenu open={is_hovered_subitems} minWidth={prop_min_width} maxWidth={prop_max_width} width={prop_width} preferedDirection={prefered_direction} openMode={sub_open_mode} subOpenMode={sub_open_mode} key={`__${key}_popupmenu__`} getPopupRect={get_HoveredSubItemPopupRect}>
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

        return <>
            <SAutoMeasurePopupPanel open={prop_open} openMode={prop_open_mode} getPopupRect={getPopupRect}>
                <SFlow gap="var(--FocusOutlineWidth)" padding="var(--GapAndMargin)" vertical style={{ 'max-width': prop_max_width, 'min-width': prop_min_width, 'width': prop_width }}>
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