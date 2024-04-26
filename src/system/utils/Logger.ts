enum LoggerLevel {
    Debug, Info, Warn, Error, Panic
}

type LoggerTargetFn = (level: LoggerLevel, msg: string, time: Date) => void;

/**
 * @deprecated not finish
 */
export class Logger {

    public readonly targets: Set<LoggerTargetFn> = new Set();

    constructor() {}
}