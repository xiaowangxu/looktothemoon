export type ExpressionToken = {
    type: string,
    label: string,
    offset: number,
    length: number,
};

export type LexMethod = (code: string) => ExpressionToken[];

export function DefaultLexMethod(code: string) {
    const tokens: ExpressionToken[] = [];
    let count = 0;
    for (const char of code) {
        const token = {
            label: char,
            type: '',
            offset: count,
            length: char.length,
        }
        switch (char) {
            case '+':
            case '-':
            case '*':
            case '/': {
                token.type = 'operator';
                break;
            }
            case '{': case '}':
            case '(': case ')':
            case '[': case ']':
            case '<': case '>': {
                token.type = 'brace';
                break;
            }
            case '@': {
                token.type = '@';
                break;
            }
        }
        tokens.push(token);
        count += token.length;
    }
    return tokens;
};