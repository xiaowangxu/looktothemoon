import { type BoxSize } from "../SunDesignConstants";

const WindowTargetId = '__sun-design-window-target__';
export const WindowTarget = '#__sun-design-window-target__';

export function useWindow() {
    const win_dom = document.body.querySelector(WindowTarget);
    if (win_dom === null) {
        const win = document.createElement('div');
        win.id = WindowTargetId;
        win.style.position = 'absolute';
        win.style.zIndex = '0';
        document.body.appendChild(win);
        window.addEventListener('resize', onDocumentWindowResized);
        return win;
    }
    return win_dom;
}

export type WinId = number;
let WindowId: WinId = 0;

const Windows: { id: WinId, update: (layer: number) => void, doc_win_resize: (box_size: BoxSize) => void, parent: WinId | undefined, children: Set<WinId> }[] = [];
const WindowsIdIndexMap: Map<WinId, number> = new Map();

function onDocumentWindowResized() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    for (const win of Windows) {
        win.doc_win_resize({ width, height });
    }
}

function hasWindow(id: WinId) {
    return WindowsIdIndexMap.has(id);
}

export function addWindow(parent: WinId | undefined, update: (layer: number) => void, doc_win_resize: (box_size: BoxSize) => void) {
    if (parent !== undefined && !hasWindow(parent)) {
        parent === undefined;
    }
    const win = { id: WindowId++, update, doc_win_resize, parent, children: new Set<WinId>() };
    if (parent !== undefined) {
        Windows[WindowsIdIndexMap.get(parent)!].children.add(win.id);
    }
    WindowsIdIndexMap.set(win.id, Windows.length);
    Windows.push(win);
    return { id: win.id, layer: Windows.length - 1 };
}

export function focusWindow(id: WinId, cascade: boolean = true) {
    if (!hasWindow(id)) return;
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
            const layer = _layer++
            win.update(layer);
            WindowsIdIndexMap.set(win.id, layer);
        }
        idx++;
    }
    if (index !== -1) {
        const win = Windows.splice(index, 1)[0];
        win.update(Windows.length);
        WindowsIdIndexMap.set(win.id, Windows.length);
        Windows.push(win);
        if (win.children.size > 0 && cascade) {
            for (const child of win.children) {
                focusWindow(child);
            }
        }
    }
}

export function canWindowClose(id: WinId) {
    if (!hasWindow(id)) return true;
    return Windows[WindowsIdIndexMap.get(id)!].children.size <= 0;
}

export function removeWindow(id: WinId) {
    if (!hasWindow(id)) return;
    if (Windows.length <= 0) return;
    if (Windows[Windows.length - 1].id === id) {
        const win = Windows.pop()!;
        WindowsIdIndexMap.delete(win.id);
        if (win.parent !== undefined) {
            clearWindowParent(win.parent, win.id);
        }
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
            win.update(_layer++);
        }
        idx++;
    }
    if (index !== -1) {
        const win = Windows.splice(index, 1)[0];
        WindowsIdIndexMap.delete(win.id);
        if (win.parent !== undefined) {
            clearWindowParent(win.parent, win.id);
        }
    }
}

function clearWindowParent(parent: WinId, child: WinId) {
    if (!hasWindow(parent)) return;
    Windows[WindowsIdIndexMap.get(parent)!].children.delete(child);
}
