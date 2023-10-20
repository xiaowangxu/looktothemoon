import { calcPopupMenuPopupSize, type BoxSize, type Rect, type PopupOpenMode, clamp, type Position } from "@/components/SConst";
import SIcon from "@/components/SIcon.vue";
import SItem, { type Item } from "@/components/SItem.vue";
import SPopupMenu from "@/components/SPopupMenu";
import SVSeparator from "@/components/SVSeparator.vue";
import { defineComponent, h, type PropType, type RenderFunction } from "vue";

export type ContextMenuItem = (Item & { subitems?: ContextMenuInstance[] });
export type ContextMenuInstance = symbol | ContextMenuItem;

export const ContextSeparatorSymbol: symbol = Symbol('ContextSeparatorSymbol');

export function get_ContextItemsRenderFunction(items: ContextMenuInstance[]) {
    return () => {
        return items.map(
            i => {
                if (i === ContextSeparatorSymbol) {
                    return h(SVSeparator);
                }
                else {
                    const { label, uid, color, disabled, active, description, subitems, icon } = i as ContextMenuItem;
                    return h(
                        SItem,
                        {
                            label, uid, color, disabled, active, description
                        },
                        {
                            icon: icon !== undefined ? () => h(SIcon, { name: icon }) : undefined,
                            subitems: subitems !== undefined ? get_ContextItemsRenderFunction(subitems) : undefined,
                        }
                    )
                }
            }
        )
    }
}

export const ContextMenuComponent = defineComponent({
    props: {
        itemsRenderFunction: {
            type: Function as PropType<RenderFunction>,
            required: true,
        },
        position: {
            type: Object as PropType<Position>,
            required: true,
        },
        onClick: {
            type: Function as PropType<(key: any) => void>,
            required: true,
        },
        onClickoutside: {
            type: Function as PropType<(event: PointerEvent) => void>,
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
        teleportDisabled: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    setup(props, ctx) {
        function get_PopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect | undefined {
            const clamped_content_size = { width: clamp(contentMinSize.width, props.minWidth, props.maxWidth), height: contentMinSize.height };
            return calcPopupMenuPopupSize(clamped_content_size, { x: props.position.x, y: props.position.y, width: 0, height: 0 }, windowSize, 1, { width: 0, height: 0 }, false).rect;
        }
        return {
            get_PopupRect
        };
    },
    render() {
        const { get_PopupRect } = this;
        const { itemsRenderFunction, minWidth, maxWidth, width, openMode, subOpenMode, preferedDirection, teleportDisabled, onClick, onClickoutside } = this.$props;
        return <SPopupMenu open={true} getPopupRect={get_PopupRect} teleportDisabled={teleportDisabled} minWidth={minWidth} maxWidth={maxWidth} width={width} openMode={openMode} subOpenMode={subOpenMode} preferedDirection={preferedDirection} onClick={onClick} onClickoutside={onClickoutside}>
            {{
                default: itemsRenderFunction,
            }}
        </SPopupMenu>
    }
});