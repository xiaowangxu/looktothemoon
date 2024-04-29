const AnimationIntervalCancellerMap: Map<number, { clear: () => void, set: (timeout: number) => void }> = new Map();

let AnimationIntervalId = 0;

const NowClass = typeof performance === 'undefined' ? Date : performance;

function now() {
    return NowClass.now();
}

export function setAnimationInterval(func: (delta_ms: number) => void, timeout_ms: number) {
    const id = AnimationIntervalId++;
    let interval = timeout_ms;
    const last_date = now();
    let last_time: DOMHighResTimeStamp | undefined = undefined;
    let frame: number;
    const on = (time: DOMHighResTimeStamp) => {
        let delta = 0;
        if (last_time === undefined) {
            delta = now() - last_date;
        }
        else {
            delta = time - last_time;
        }
        if (delta >= interval) {
            last_time = time;
            func(delta);
        }
        frame = requestAnimationFrame(on);
    };
    frame = requestAnimationFrame(on);
    AnimationIntervalCancellerMap.set(id, {
        clear: () => {
            cancelAnimationFrame(frame);
        },
        set: (timeout_ms: number) => {
            interval = timeout_ms;
        }
    });
    return id;
}

export function clearAnimationInterval(id: number | undefined) {
    if (id === undefined) return;
    if (AnimationIntervalCancellerMap.has(id)) {
        AnimationIntervalCancellerMap.get(id)!.clear();
        AnimationIntervalCancellerMap.delete(id);
    }
}

export function changeAnimationInterval(id: number | undefined, timeout_ms: number) {
    if (id === undefined) return;
    if (AnimationIntervalCancellerMap.has(id)) {
        AnimationIntervalCancellerMap.get(id)!.set(timeout_ms);
    }
}