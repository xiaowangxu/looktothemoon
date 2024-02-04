import type { InjectionKey, Ref } from "vue";
import type { UID } from "../SunDesignConstants";

export const SunRadioGroupInjection = Symbol() as InjectionKey<{
    value: Ref<UID | undefined>,
    toggle(val: UID | undefined): void,
}>;