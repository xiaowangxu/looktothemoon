import { createApp, type App } from 'vue';
import { ContextMenuComponent, ContextSeparatorSymbol, get_ContextItemsRenderFunction, type ContextMenuInstance, type ContextMenuItem } from './ContextMenuComponent';
import { SignalEmitter } from '@/system/utils/SignalEmitter';

export class ContextMenu {
    private div_dom: HTMLDivElement | undefined = undefined;
    private contextmenu_app: App | undefined = undefined;
    private readonly items: ContextMenuInstance[];

    // signal
    public readonly signal_item_clicked: SignalEmitter<(key: any) => void> = new SignalEmitter();
    public readonly signal_clicked_outside: SignalEmitter<(event: PointerEvent) => void> = new SignalEmitter();

    constructor(items: ContextMenuInstance[]) {
        this.items = items;
    }

    static get separator(): ContextMenuInstance {
        return ContextSeparatorSymbol;
    }

    private on_Click(key: any) {
        this.close();
        this.signal_item_clicked.trigger(key);
    }
    
    private on_ClickOutside(event: PointerEvent) {
        this.close();
        this.signal_clicked_outside.trigger(event);
    }

    public show(x: number | PointerEvent, y?: number) {
        let _x: number, _y: number;
        if (x instanceof PointerEvent) {
            _x = x.clientX;
            _y = x.clientY;
        }
        else {
            _x = x;
            _y = y!;
        }
        this.close();
        this.div_dom = document.createElement('div');
        this.contextmenu_app = createApp(ContextMenuComponent, {
            itemsRenderFunction: get_ContextItemsRenderFunction(this.items),
            position: { x: _x, y: _y },
            onClick: this.on_Click.bind(this),
            onClickoutside: this.on_ClickOutside.bind(this),
        });
        this.contextmenu_app.mount(this.div_dom);
        document.body.appendChild(this.div_dom);
    }

    public close() {
        if (this.contextmenu_app !== undefined) {
            this.contextmenu_app.unmount();
            this.contextmenu_app = undefined;
        }
        if (this.div_dom !== undefined) {
            document.body.removeChild(this.div_dom);
            this.div_dom = undefined;
        }
    }
}