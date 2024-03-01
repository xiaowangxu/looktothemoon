import type { Item, UID } from "../SunDesignConstants";

export function DefaultCodeFilterSort(list: Item[], keyword?: string) {
    if (keyword === undefined || keyword === '') return list;
    const _keyword = keyword.toLowerCase();
    return list.filter(s => {
        return s.label !== undefined && s.label.toLowerCase().includes(_keyword);
    });
}

export function DefaultCodeFindSelect(list: Item[], keyword?: string, selected?: UID) {
    if (keyword === undefined || keyword === '') return -1;
    keyword = keyword.toLowerCase();
    const targtes = list.filter(s => {
        return s.label !== undefined && s.label.toLowerCase().includes(keyword!);
    });
    if (targtes.findIndex(s => s.uid === selected) >= 0) return -1;
    return list.findIndex(s => s.uid === targtes[0].uid);
}

export function replaceAllCaseInsensitive(str: string, replace: string, replacer: (str: string) => string) {
    const _str_length = str.length;
    const _key_length = replace.length;
    if (_str_length === 0 || _key_length === 0) return str;
    const _str = str.toLowerCase();
    const _key = replace.toLowerCase();
    const slices: string[] = [];
    let pos = 0;
    let last_pos = 0;
    while ((pos = _str.indexOf(_key, pos)) !== -1) {
        slices.push(str.substring(last_pos, pos));
        slices.push(str.substring(pos, pos + _key_length));
        pos += _key_length;
        last_pos = pos;
    }
    if (last_pos < _str_length) {
        slices.push(str.substring(last_pos));
    }
    if (slices.length === 0) return '';
    else if (slices.length === 1) return slices[0];
    else {
        let m = 2;
        while (m < slices.length) {
            if (slices[m] === '') {
                if (m + 1 < slices.length) {
                    slices[m - 1] = `${slices[m - 1]}${slices[m + 1]}`;
                    slices.splice(m, 2);
                }
                else {
                    slices.splice(m, 1);
                }
            }
            else {
                m += 2;
            }
        }
        for (let i = 1; i < slices.length; i += 2) {
            slices[i] = replacer(slices[i]);
        }
        return slices.join('');
    }
};

export function DefaultHighlight(str: string, keyword?: string): string {
    if (keyword === undefined) return str;
    return replaceAllCaseInsensitive(str, keyword, s => `<span class="__sun-design-completion__ keyword">${s}</span>`);
}