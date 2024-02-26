import '../SunDesignStyle.styl';
import { createApp, type App, markRaw, type Component, defineComponent, type Directive, type FunctionalComponent, type ObjectDirective } from "vue";
import SunMeasurePopupPanel from "../measurepopuppanel/SunMeasurePopupPanel.vue";
import SunLabel from "../label/SunLabel.vue";
import { timer, type BoxSize, type Rect, type TimerCanceller, calcButtonPopupRect, type Position, type Item, calcMenuPopupRect, calcButtonHorizontalPopupRect, DefaultOffset } from "../SunDesignConstants";
import SunButtonLike from '../button/SunButtonLike.vue';
import SunButtonItem from "../item/SunButtonItem.vue";
import type { Required } from "@/system/utils/Type";

//#region component

const SunHoverMenuPopup = defineComponent({
    props: {
        content: {
            required: true,
        },
        binding: {
            required: true,
        },
        panelProps: {
            required: true,
        },
        getPopupRect: {
            required: true,
        },
        trapFocus: {
            type: Boolean,
        }
    },
    emits: ['mouseenter', 'mouseleave'],
    setup(props, ctx) {
        function onMouseenter(evt: MouseEvent) {
            ctx.emit('mouseenter', evt);
        }
        function onMouseleave(evt: MouseEvent) {
            ctx.emit('mouseleave', evt);
        }
        return { onMouseenter, onMouseleave };
    },
    render() {
        const binding: Record<string, unknown> = this.$props.binding as any;
        const content: Component = this.$props.content as any;
        const panelProps: SunMeasurePopupPanelPropsType = this.$props.panelProps as any;
        const getPopupRect: (contentMinSize: BoxSize, windowSize: BoxSize) => Rect = this.$props.getPopupRect as any;
        const trapFocus: boolean = this.$props.trapFocus ?? false;
        return <SunMeasurePopupPanel {...panelProps} trapFocus={trapFocus} getPopupRect={getPopupRect} stopEvents={false} onMouseenter={this.onMouseenter} onMouseleave={this.onMouseleave}>
            <content {...binding} />
        </SunMeasurePopupPanel>;
    }
});

type SunMeasurePopupPanelPropsType = Omit<InstanceType<typeof SunMeasurePopupPanel>["$props"], 'getPopupRect'> & Partial<Pick<InstanceType<typeof SunMeasurePopupPanel>["$props"], 'getPopupRect'>>;

//#endregion

//#region group

const SunHoverMenuGroups: Map<string, Set<SunHoverMenuBase<any, any>>> = new Map();

function addSunHoverMenuGroup(hover_menu: SunHoverMenuBase<any, any>) {
    const group = hover_menu.group;
    if (group === undefined) return;
    if (SunHoverMenuGroups.has(group)) {
        SunHoverMenuGroups.get(group)!.add(hover_menu);
    }
    else {
        SunHoverMenuGroups.set(group, new Set([hover_menu]));
    }
}

function onSunHoverMenuOpen(hover_menu: SunHoverMenuBase<any, any>) {
    const group = hover_menu.group;
    if (group === undefined) return;
    if (SunHoverMenuGroups.has(group)) {
        for (const menu of SunHoverMenuGroups.get(group)!) {
            if (menu !== hover_menu) {
                menu.close();
            }
        }
    }
}

function removeSunHoverMenuGroup(hover_menu: SunHoverMenuBase<any, any>) {
    const group = hover_menu.group;
    if (group === undefined) return;
    if (SunHoverMenuGroups.has(group)) {
        const set = SunHoverMenuGroups.get(group)!;
        set.delete(hover_menu);
        if (set.size <= 0) {
            SunHoverMenuGroups.delete(group);
        }
    }
}

function hasSunHoverMenuGroup(group: string) {
    return SunHoverMenuGroups.has(group);
}

//#endregion

//#region SunHoverMenuBase

export interface SunHoverMenuOption {
    openDelay?: number,
    closeDelay?: number,
    menuHover?: boolean,
    group?: string,
    syncGroup?: boolean,
    trapFocus?: boolean,
};

type HoverMenuGetPopupRect = (contentMinSize: BoxSize, windowSize: BoxSize, mousePosition: Position) => Rect;

class SunHoverMenuBase<D extends Record<string, unknown>, T extends Component> {
    private root: HTMLDivElement | undefined;
    private vue: App | undefined;
    private readonly content: T;
    private readonly binding: D;
    private readonly panel_props: SunMeasurePopupPanelPropsType | undefined;
    private readonly get_popup_rect: (contentMinSize: BoxSize, windowSize: BoxSize) => Rect;
    private readonly option: Required<SunHoverMenuOption, 'closeDelay' | 'openDelay' | 'menuHover' | 'syncGroup'>;
    protected readonly mouse_position = { x: 0, y: 0 };
    public get group() { return this.option.group; }

    private open_timer: TimerCanceller | undefined;
    private close_timer: TimerCanceller | undefined;

    constructor(content: T, binding: D, get_popup_rect: HoverMenuGetPopupRect, panel_props?: SunMeasurePopupPanelPropsType, option?: SunHoverMenuOption) {
        this.content = content instanceof Function ? content : markRaw(content);
        this.binding = binding;
        this.panel_props = panel_props;
        this.get_popup_rect = (contentMinSize: BoxSize, windowSize: BoxSize) => get_popup_rect(contentMinSize, windowSize, this.mouse_position);
        this.option = {
            ...option,
            openDelay: option?.openDelay ?? 750,
            closeDelay: option?.closeDelay ?? 250,
            menuHover: option?.menuHover ?? true,
            syncGroup: option?.syncGroup ?? true,
        };
    }

    protected onMouseenter(evt: MouseEvent) {
        this.close_timer?.();
        this.close_timer = undefined;
        if (this.open_timer === undefined && this.vue === undefined) {
            this.onMousemove(evt);
            if (this.option.syncGroup && this.group !== undefined && hasSunHoverMenuGroup(this.group)) {
                this.open();
            }
            else {
                this.open_timer = timer(this.open.bind(this), this.option.openDelay);
            }
        }
    }

    protected onMousemove(evt: MouseEvent) {
        this.mouse_position.x = evt.clientX;
        this.mouse_position.y = evt.clientY;
    }

    protected onMouseleave(evt: MouseEvent) {
        this.open_timer?.();
        this.open_timer = undefined;
        if (this.close_timer === undefined) {
            this.close_timer = timer(this.close.bind(this), this.option.closeDelay);
        }
    }

    public open() {
        if (this.vue !== undefined) return;
        this.root = document.createElement('div');
        document.body.classList.add('__sun-design__', 'color-def');
        document.body.appendChild(this.root);
        this.vue = createApp(SunHoverMenuPopup, {
            content: this.content,
            binding: this.binding,
            panelProps: this.panel_props,
            getPopupRect: this.get_popup_rect,
            onMouseenter: (evt: MouseEvent) => { if (this.option.menuHover) this.onMouseenter(evt) },
            onMouseleave: (evt: MouseEvent) => { if (this.option.menuHover) this.onMouseleave(evt) },
            trapFocus: this.option.trapFocus,
        });
        this.vue.mount(this.root);
        this.open_timer?.();
        this.open_timer = undefined;
        addSunHoverMenuGroup(this);
        onSunHoverMenuOpen(this);
    }

    public close() {
        if (this.vue === undefined) return;
        this.vue?.unmount();
        this.vue = undefined;
        if (this.root) {
            document.body.removeChild(this.root);
            this.root = undefined;
        }
        this.open_timer?.();
        this.open_timer = undefined;
        this.close_timer?.();
        this.close_timer = undefined;
        removeSunHoverMenuGroup(this);
    }
}

//#endregion

//#region SunHoverMenu

const LabelStringElement: FunctionalComponent<{ string: string }> = (props, ctx) => {
    return <>
        <SunLabel noHorizontalPadding={false}>{props.string}</SunLabel>
    </>;
};

const HtmlStringElement: FunctionalComponent<{ html: string, label: boolean }> = (props, ctx) => {
    return <>
        {
            props.label ?
                <SunLabel noHorizontalPadding={false} v-html={props.html} ></SunLabel> :
                <div v-html={props.html} />
        }
    </>;
};

const ItemElement: FunctionalComponent<{ item: Item }> = (props, ctx) => {
    const { label, icon, description, shortcut } = props.item;
    return <>
        {
            <SunButtonLike flat noHoverColor noPressedColor>
                <SunButtonItem label={label} icon={icon} description={description} shortcut={shortcut} />
            </SunButtonLike>
        }
    </>;
};

type HoverMenuWithTargetGetPopupRect = (targetRect: Rect, contentMinSize: BoxSize, windowSize: BoxSize, mousePosition: Position) => Rect;

export default class SunHoverMenu<D extends Record<string, unknown>, T extends Component> extends SunHoverMenuBase<D, T> {
    private target: HTMLElement;

    constructor(target: HTMLElement, content: T, binding: D, get_popup_rect?: HoverMenuWithTargetGetPopupRect, panel_props?: SunMeasurePopupPanelPropsType, option?: SunHoverMenuOption) {
        const _get_popup_rect: HoverMenuGetPopupRect = (contentMinSize, windowSize, mousePosition) => {
            const { x, y, width, height } = this.target.getBoundingClientRect();
            if (get_popup_rect) {
                return get_popup_rect({ x, y, width, height }, contentMinSize, windowSize, mousePosition);
            }
            return calcButtonPopupRect({ x, y, width: 0, height }, contentMinSize, windowSize, 0);
        }
        super(content, binding, _get_popup_rect, panel_props, option);
        this.target = target;
        this.target.addEventListener('mouseenter', this._onMouseenter);
        this.target.addEventListener('mousemove', this._onMousemove);
        this.target.addEventListener('mouseleave', this._onMouseleave);
        this.target.addEventListener('mousedown', this._onClose);
        this.target.addEventListener('keydown', this._onClose);
    }

    private readonly _onClose = this.close.bind(this);
    private readonly _onMouseenter = this.onMouseenter.bind(this);
    private readonly _onMousemove = this.onMousemove.bind(this);
    private readonly _onMouseleave = this.onMouseleave.bind(this);

    public dispose() {
        this.close();
        this.target.removeEventListener('mouseenter', this._onMouseenter);
        this.target.removeEventListener('mousemove', this._onMousemove);
        this.target.removeEventListener('mouseleave', this._onMouseleave);
        this.target.removeEventListener('mousedown', this._onClose);
    }
}

//#endregion

// directive
const vHoverMenuId = '__v-hover-menu__' as const;

type BindingType = {
    content: Component,
    binding: Record<string, any>,
    panel_props?: SunMeasurePopupPanelPropsType,
    option?: SunHoverMenuOption,
};

const vHoverMenuGetPopupRect: { [x: string]: HoverMenuWithTargetGetPopupRect } = {
    'bottom-left': (targetRect, contentMinSize, windowSize, mousePosition) => {
        return calcButtonPopupRect({ x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height }, contentMinSize, windowSize, 0, 0, undefined, undefined, false);
    },
    'bottom-right': (targetRect, contentMinSize, windowSize, mousePosition) => {
        return calcButtonPopupRect({ x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height }, contentMinSize, windowSize, 1, 0, undefined, undefined, false);
    },
    'top-left': (targetRect, contentMinSize, windowSize, mousePosition) => {
        return calcButtonPopupRect({ x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height }, contentMinSize, windowSize, 0, 1, undefined, undefined, false);
    },
    'top-right': (targetRect, contentMinSize, windowSize, mousePosition) => {
        return calcButtonPopupRect({ x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height }, contentMinSize, windowSize, 1, 1, undefined, undefined, false);
    },
    'right-top': (targetRect, contentMinSize, windowSize, mousePosition) => {
        return calcButtonHorizontalPopupRect({ x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height }, contentMinSize, windowSize, 0, 1, undefined, undefined, false);
    },
    'right-bottom': (targetRect, contentMinSize, windowSize, mousePosition) => {
        return calcButtonHorizontalPopupRect({ x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height }, contentMinSize, windowSize, 1, 1, undefined, undefined, false);
    },
    'left-top': (targetRect, contentMinSize, windowSize, mousePosition) => {
        return calcButtonHorizontalPopupRect({ x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height }, contentMinSize, windowSize, 0, 0, undefined, undefined, false);
    },
    'left-bottom': (targetRect, contentMinSize, windowSize, mousePosition) => {
        return calcButtonHorizontalPopupRect({ x: targetRect.x, y: targetRect.y, width: targetRect.width, height: targetRect.height }, contentMinSize, windowSize, 1, 0, undefined, undefined, false);
    },
    'mouse': (targetRect, contentMinSize, windowSize, mousePosition) => {
        return calcMenuPopupRect(contentMinSize, { x: mousePosition.x, y: mousePosition.y, width: 0, height: 0 }, windowSize, 0, { width: DefaultOffset, height: DefaultOffset }).rect;
    },
} as const;

function getHoverMenuGetPopupRect(binding: Record<string, boolean>): HoverMenuWithTargetGetPopupRect | undefined {
    if ('bottom-left' in binding) { return vHoverMenuGetPopupRect['bottom-left']; }
    if ('bottom-right' in binding) { return vHoverMenuGetPopupRect['bottom-right']; }
    if ('top-left' in binding) { return vHoverMenuGetPopupRect['top-left']; }
    if ('top-right' in binding) { return vHoverMenuGetPopupRect['top-right']; }
    if ('right-top' in binding) { return vHoverMenuGetPopupRect['right-top']; }
    if ('right-bottom' in binding) { return vHoverMenuGetPopupRect['right-bottom']; }
    if ('left-top' in binding) { return vHoverMenuGetPopupRect['left-top']; }
    if ('left-bottom' in binding) { return vHoverMenuGetPopupRect['left-bottom']; }
    if ('mouse' in binding) { return vHoverMenuGetPopupRect['mouse']; }
    return undefined;
}

export const vHoverMenu: ObjectDirective<HTMLElement & { [vHoverMenuId]?: SunHoverMenu<any, any> }, BindingType | string | Item> = {
    mounted(el, binding) {
        if (el[vHoverMenuId] === undefined) {
            const option: SunHoverMenuOption = { group: binding.arg, menuHover: binding.modifiers.nohover === true ? false : true };
            const get_popup_rect: HoverMenuWithTargetGetPopupRect | undefined = getHoverMenuGetPopupRect(binding.modifiers);
            if (typeof binding.value === 'string') {
                if (binding.modifiers.html === true) {
                    el[vHoverMenuId] = new SunHoverMenu(el, HtmlStringElement, { html: binding.value, label: binding.modifiers.label === true }, get_popup_rect, undefined, option);
                }
                else if (binding.modifiers.item === true) {
                    el[vHoverMenuId] = new SunHoverMenu(el, HtmlStringElement, { html: binding.value, label: binding.modifiers.label === true }, get_popup_rect, undefined, option);
                }
                else {
                    el[vHoverMenuId] = new SunHoverMenu(el, LabelStringElement, { string: binding.value }, get_popup_rect, undefined, option);
                }
            }
            else if ((binding.value as Item).uid !== undefined) {
                // is item
                el[vHoverMenuId] = new SunHoverMenu(el, ItemElement, { item: binding.value as Item }, get_popup_rect, undefined, option);
            }
            else {
                const bind = binding.value as BindingType;
                el[vHoverMenuId] = new SunHoverMenu(el, bind.content, bind.binding, get_popup_rect, bind.panel_props, { ...option, ...bind.option });
            }
        }
    },
    unmounted(el, binding) {
        if (el[vHoverMenuId] !== undefined) {
            el[vHoverMenuId].close();
            el[vHoverMenuId].dispose();
            el[vHoverMenuId] = undefined;
        }
    }
};