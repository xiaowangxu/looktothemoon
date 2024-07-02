import { Singleton as Singleton } from "./Singleton";

type SettingEntry = {
    [key: string]: SettingEntry,
} | number | string | boolean;

export type Settings = {
    [key: string]: SettingEntry,
}

export class SettingsSingleton extends Singleton {

    public static singleton_name: string = 'SettingSingletion';

    protected settings = new Map([
        ['editor/colors/red', 0xDA2530FF],
        ['editor/colors/green', 0x1BAF4AFF],
        ['editor/colors/blue', 0x0A4DFFFF],
        ['editor/colors/highlight', 0xFF8400FF],
        ['editor/colors/grey', 0x606060FF],
    ]);

    public get_Setting<T = any>(path: string, default_value: T): T {
        return (this.settings.get(path) as T | undefined) ?? default_value;
    }

    public set_Setting<T = any>(path: string, value: T, create: boolean = true): boolean {
        throw new Error('not impl');
    }
}