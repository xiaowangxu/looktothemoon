export function setAnimationInterval(func: () => void, interval: number) {
    let last_date: DOMHighResTimeStamp | undefined = undefined;
    const on = (time: DOMHighResTimeStamp) => {
        if (last_date === undefined || time - last_date >= interval) {
            last_date = time;
            func();
        }
        requestAnimationFrame(on);
    };
    requestAnimationFrame(on);
}