import { Result } from '@/system/utils/Result';

const ResFiles: { [path: string]: string } = import.meta.glob(['/res/**/*.lttm', '!/res/**/*.ignore.lttm'], { as: 'raw', eager: true });

export function load_ResFile_from_Path(path: string): Result<string, Error> {
    const index = path.indexOf('://');
    if (index < 0) return Result.Error(new Error('path invalid'));
    const header = path.substring(0, index);
    const p = path.substring(index + 3, path.length);
    if (header === 'res') {
        const full_path = `/res/${p}`;
        const file = ResFiles[full_path];
        if (file === undefined) return Result.Error(new Error(`file ${path} does not exist`));
        return Result.Ok(file);
    }
    else {
        return Result.Error(new Error(`unknown path source ${header}://`));
    }
}