export type Required<Type, Key extends keyof Type> = Type & { [Property in Key]-?: Type[Property]; };

export type Self<T> = T;