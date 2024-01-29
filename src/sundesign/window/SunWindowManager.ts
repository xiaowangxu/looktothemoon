import { ref } from "vue";

let WindowId = 0;

export function addWindow() {
    const layer = ref(0);
    const win = { id: WindowId++, layer };
    return win;
}