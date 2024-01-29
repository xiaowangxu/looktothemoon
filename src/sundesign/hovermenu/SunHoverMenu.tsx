import { createApp, type App, markRaw, type Component, defineComponent, type Directive, type FunctionalComponent, type ObjectDirective } from "vue";
import SunMeasurePopupPanel from "../measurepopuppanel/SunMeasurePopupPanel.vue";
import SunLabel from "../label/SunLabel.vue";
import { timer, type BoxSize, type Rect, type TimerCanceller, calcButtonPopupRect } from "../SunDesignConstants";
import '../SunDesignStyle.styl';

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
        return <SunMeasurePopupPanel {...panelProps} getPopupRect={getPopupRect} stopEvents={false} onMouseenter={this.onMouseenter} onMouseleave={this.onMouseleave}>
            <content {...binding} />
        </SunMeasurePopupPanel>;
    }
});

type SunMeasurePopupPanelPropsType = Omit<InstanceType<typeof SunMeasurePopupPanel>["$props"], 'getPopupRect'> & Partial<Pick<InstanceType<typeof SunMeasurePopupPanel>["$props"], 'getPopupRect'>>;

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

export interface SunHoverMenuOption {
    open_delay?: number,
    close_delay?: number,
    menu_hover?: boolean,
    group?: string,
}

type Required<Type, Key extends keyof Type> = Type & { [Property in Key]-?: Type[Property]; };
class SunHoverMenuBase<D extends Record<string, unknown>, T extends Component> {
    private root: HTMLDivElement | undefined;
    private vue: App | undefined;
    private readonly content: T;
    private readonly binding: D;
    private readonly panel_props: SunMeasurePopupPanelPropsType | undefined;
    private readonly get_popup_rect: (contentMinSize: BoxSize, windowSize: BoxSize) => Rect;
    private readonly option: Required<SunHoverMenuOption, 'close_delay' | 'open_delay' | 'menu_hover'>;
    protected readonly mouse_position = { x: 0, y: 0 };
    public get group() { return this.option.group; }

    private open_timer: TimerCanceller | undefined;
    private close_timer: TimerCanceller | undefined;

    constructor(content: T, binding: D, get_popup_rect: (contentMinSize: BoxSize, windowSize: BoxSize) => Rect, panel_props?: SunMeasurePopupPanelPropsType, option?: SunHoverMenuOption) {
        this.content = content instanceof Function ? content : markRaw(content);
        this.binding = binding;
        this.panel_props = panel_props;
        this.get_popup_rect = get_popup_rect;
        this.option = {
            ...option,
            open_delay: option?.open_delay ?? 500,
            close_delay: option?.close_delay ?? 750,
            menu_hover: option?.menu_hover ?? true,
        };
    }

    protected onMouseenter(evt: MouseEvent) {
        this.close_timer?.();
        this.close_timer = undefined;
        if (this.open_timer === undefined && this.vue === undefined) {
            this.open_timer = timer(this.open.bind(this), this.option.open_delay);
            this.mouse_position.x = evt.clientX;
            this.mouse_position.y = evt.clientY;
        }
    }

    protected onMouseleave(evt: MouseEvent) {
        this.open_timer?.();
        this.open_timer = undefined;
        if (this.close_timer === undefined) {
            this.close_timer = timer(this.close.bind(this), this.option.close_delay);
        }
    }

    public open() {
        if (this.vue === undefined) {
            this.root = document.createElement('div');
            document.body.classList.add('__sun-design__', 'color-def');
            document.body.appendChild(this.root);
            this.vue = createApp(SunHoverMenuPopup, {
                content: this.content,
                binding: this.binding,
                panelProps: this.panel_props,
                getPopupRect: this.get_popup_rect,
                onMouseenter: (evt: MouseEvent) => { if (this.option.menu_hover) this.onMouseenter(evt) },
                onMouseleave: (evt: MouseEvent) => { if (this.option.menu_hover) this.onMouseleave(evt) },
            });
            this.vue.mount(this.root);
        }
        this.open_timer?.();
        this.open_timer = undefined;
        addSunHoverMenuGroup(this);
        onSunHoverMenuOpen(this);
    }

    public close() {
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

const LabelStringElement: FunctionalComponent<{ string: string }> = (props, ctx) => {
    return <>
        <SunLabel noHorizontalPadding={false}>{props.string}</SunLabel>
    </>;
};
const HtmlStringElement: FunctionalComponent<{ html: string, label: boolean }> = (props, ctx) => {
    return <>
        {
            props.label ?
                <SunLabel noHorizontalPadding={false} vHtml={props.html} ></SunLabel> :
                <div vHtml={props.html} />
        }
    </>;
};
export default class SunHoverMenu<D extends Record<string, unknown>, T extends Component> extends SunHoverMenuBase<D, T> {
    private target: HTMLElement;

    constructor(target: HTMLElement, content: T, binding: D, panel_props?: SunMeasurePopupPanelPropsType, option?: SunHoverMenuOption) {
        super(content, binding, (contentMinSize: BoxSize, windowSize: BoxSize) => {
            const { x, y, width, height } = target.getBoundingClientRect();
            return calcButtonPopupRect({ x, y, width: 0, height }, contentMinSize, windowSize, 0);
        }, panel_props, option);
        this.target = target;
        this.target.addEventListener('mouseenter', this._onTargetMouseenter);
        this.target.addEventListener('mousemove', this._onTargetMousemove);
        this.target.addEventListener('mouseleave', this._onTargetMouseleave);
    }

    private readonly _onTargetMouseenter = this.onTargetMouseenter.bind(this);
    private onTargetMouseenter(evt: MouseEvent) {
        this.onMouseenter(evt);
    }

    private readonly _onTargetMousemove = this.onTargetMousemove.bind(this);
    private onTargetMousemove(evt: MouseEvent) {
        this.onMouseleave(evt);
        this.onMouseenter(evt);
    }

    private readonly _onTargetMouseleave = this.onTargetMouseleave.bind(this);
    private onTargetMouseleave(evt: MouseEvent) {
        this.onMouseleave(evt);
    }

    public dispose() {
        this.close();
        this.target.removeEventListener('mouseenter', this._onTargetMouseenter);
        this.target.removeEventListener('mousemove', this._onTargetMousemove);
        this.target.removeEventListener('mouseleave', this._onTargetMouseleave);
    }
}

// directive
const vHoverMenuId = '__v_hover_menu' as const;
export const vHoverMenu: ObjectDirective<HTMLElement & { [vHoverMenuId]?: SunHoverMenu<any, any> }, {
    content: Component, binding: Record<string, any>, panel_props?: SunMeasurePopupPanelPropsType, option?: SunHoverMenuOption
} | string> = {
    mounted(el, binding) {
        console.log(binding);
        if (el[vHoverMenuId] === undefined) {
            const option: SunHoverMenuOption = { group: binding.arg, menu_hover: binding.modifiers.nohover === true ? false : true };
            if (typeof binding.value === 'string') {
                if (binding.modifiers.html === true) {
                    el[vHoverMenuId] = new SunHoverMenu(el, HtmlStringElement, { html: binding.value, label: binding.modifiers.label === true }, undefined, option);
                }
                else {
                    el[vHoverMenuId] = new SunHoverMenu(el, LabelStringElement, { string: binding.value }, undefined, option);
                }
            }
            else {
                el[vHoverMenuId] = new SunHoverMenu(el, binding.value.content, binding.value.binding, binding.value.panel_props, { ...option, ...binding.value.option });
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