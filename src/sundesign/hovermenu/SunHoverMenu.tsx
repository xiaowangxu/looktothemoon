import { createApp, type App, markRaw, type Component, defineComponent } from "vue";
import SunMeasurePopupPanel from "../measurepopuppanel/SunMeasurePopupPanel.vue";
import { type BoxSize, type Rect } from "../SunDesignConstants";
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
    },
    setup(props, ctx) {
        function getPopupRect(contentMinSize: BoxSize, windowSize: BoxSize): Rect {
            return { x: 60, y: 60, ...contentMinSize };
        }
        return { getPopupRect };
    },
    render() {
        const getPopupRect = this.getPopupRect;
        const binding: Record<string, unknown> = this.$props.binding as any;
        const content: Component = this.$props.content as any;
        const panelProps: SunMeasurePopupPanelPropsType = this.$props.panelProps as any;
        return <SunMeasurePopupPanel {...panelProps} getPopupRect={getPopupRect} stopEvents={false}>
            <content {...binding} />
        </SunMeasurePopupPanel>;
    }
});

type SunMeasurePopupPanelPropsType = Omit<InstanceType<typeof SunMeasurePopupPanel>["$props"], 'getPopupRect'> & Partial<Pick<InstanceType<typeof SunMeasurePopupPanel>["$props"], 'getPopupRect'>>;

export default class SunHoverMenu<D extends Record<string, unknown>, T extends Component> {
    private readonly root: HTMLDivElement = document.createElement('div');
    private readonly vue: App;

    constructor(content: T, binding: D, panel_props?: SunMeasurePopupPanelPropsType) {
        document.body.classList.add('__sun-design__', 'color-def');
        document.body.appendChild(this.root);
        this.vue = createApp(SunHoverMenuPopup, {
            content: markRaw(content),
            binding: binding,
            panelProps: panel_props,
        });
        this.vue.mount(this.root);
    }
}