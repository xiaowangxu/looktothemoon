import type { InjectionKey, Ref } from "vue";

export const SunPanelFoldContainerGroupInjection = Symbol() as InjectionKey<{
    value: Ref<number | undefined>,
    open(uid: number): void,
    close(uid: number): void,
}>;