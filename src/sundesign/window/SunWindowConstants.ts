import { ref, type Ref } from "vue";

const WindowTargetId = '__sun-design-window-target__';
export const WindowTarget = '#__sun-design-window-target__';

export function useWindow() {
    const window = document.body.querySelector(WindowTarget);
    if (window === null) {
        const win = document.createElement('div');
        win.id = WindowTargetId;
        win.style.position = 'absolute';
        win.style.zIndex = '0';
        document.body.appendChild(win);
    }
}

let WindowId = 0;

const Windows: { id: number, layer: Ref<number> }[] = [];

export function addWindow() {
    const layer = ref(Windows.length);
    const win = { id: WindowId++, layer };
    Windows.push(win);
    return win;
}

export function focusWindow(id: number) {
    if (Windows.length <= 0) return;
    if (Windows[Windows.length - 1].id === id) return;
    let _layer = 0;
    let index = -1;
    let idx = 0;
    for (const win of Windows) {
        if (win.id === id) {
            index = idx;
        }
        else {
            win.layer.value = _layer++;
        }
        idx++;
    }
    if (index !== -1) {
        const win = Windows.splice(index, 1)[0];
        win.layer.value = Windows.length;
        Windows.push(win);
    }
}

export function removeWindow(id: number) {
    if (Windows.length <= 0) return;
    if (Windows[Windows.length - 1].id === id) {
        Windows.pop();
        return;
    }
    let _layer = 0;
    let index = -1;
    let idx = 0;
    for (const win of Windows) {
        if (win.id === id) {
            index = idx;
        }
        else {
            win.layer.value = _layer++;
        }
        idx++;
    }
    if (index !== -1) {
        Windows.splice(index, 1);
    }
}