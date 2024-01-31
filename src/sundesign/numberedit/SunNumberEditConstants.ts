import { Parser } from "expr-eval";

const ExpParser = new Parser();

export function validateExpression(exp: string, idents?: string[]) {
    try {
        const res = ExpParser.parse(exp);
        const sym = res.symbols();
        if (idents === undefined) return true;
        for (const ident of sym) {
            if (!idents.includes(ident)) return false;
        }
        return true;
    }
    catch (err) {
        return false;
    }
}

export function evalExpression(exp: string, consts: Record<string, number>, default_val: number) {
    try {
        const res = ExpParser.parse(exp);
        const sym = res.symbols();
        for (const ident of sym) {
            if (!(ident in consts)) return default_val;
        }
        return res.evaluate(consts);
    }
    catch (err) {
        return default_val;
    }
}