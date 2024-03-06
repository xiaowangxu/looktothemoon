const AnimationIntervalCancellerMap: Map<number, { clear: () => void, set: (timeout: number) => void }> = new Map();

let AnimationIntervalId = 0;

export function setAnimationInterval(func: (delta: number) => void, timeout: number) {
    const id = AnimationIntervalId++;
    let interval = timeout;
    let last_time: DOMHighResTimeStamp | undefined = undefined;
    let frame: number;
    const on = (time: DOMHighResTimeStamp) => {
        let should_call = false;
        let delta = 0;
        if (last_time === undefined) should_call = true;
        else if ((delta = (time - last_time)) >= interval) should_call = true;
        if (should_call) {
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
        set: (timeout: number) => {
            interval = timeout;
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

export function changeAnimationInterval(id: number | undefined, timeout: number) {
    if (id === undefined) return;
    if (AnimationIntervalCancellerMap.has(id)) {
        AnimationIntervalCancellerMap.get(id)!.set(timeout);
    }
}