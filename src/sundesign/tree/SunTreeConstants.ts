import type { InjectionKey, Ref } from "vue";
import type { UID } from "../SunDesignConstants";

export const TreeCheckedDataInjectionKey = Symbol() as InjectionKey<{
    checked: Ref<UID[]>,
    setChecked: (uid: UID | UID[], check: boolean) => void,
}>;