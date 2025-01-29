/* AutoGenerated Code, changes may be overwritten
* INPUT GRAMMAR:
* ---
* export interface Todo {
*   completed: boolean;
*   completionDate?: string;
*   createdDate?: string;
*   priority?: string;
*   id?: string;
*   text: string;
*   projects: string[];
*   contexts: string[];
* }
* function extractProjects(text: string): string[] {
*   return (text.match(/\+(\S+)/g) || []).map(s => s.slice(1));
* }
* function extractContexts(text: string): string[] {
*   return (text.match(/@(\S+)/g) || []).map(s => s.slice(1));
* }
* ---
* TodoLine
*   := CompletedTodo | IncompleteTodo
* CompletedTodo
*   := 'x' ws+ completionDate=Date ws+ createdDate=Date ws+ text=RemainingText
*     .value = Todo {
*       return {
*         completed: true,
*         completionDate: completionDate.value,
*         createdDate: createdDate.value,
*         text: text.value,
*         projects: extractProjects(text.value),
*         contexts: extractContexts(text.value),
*         priority: undefined,
*         id: undefined
*       };
*     }
* IncompleteTodo
*   := p={ priority=Priority ws+ }? c={ createdDate=Date ws+ }? text=RemainingText
*     .value = Todo {
*       return {
*         completed: false,
*         priority: p?.priority.value,
*         createdDate: c?.createdDate.value,
*         text: text.value,
*         projects: extractProjects(text.value),
*         contexts: extractContexts(text.value),
*         completionDate: undefined,
*         id: undefined
*       };
*     }
* Date
*   := yyyy='[0-9][0-9][0-9][0-9]' '-' mm='[0-9][0-9]' '-' dd='[0-9][0-9]'
*     .value = string{ return `${this.yyyy}-${this.mm}-${dd}`; }
* Priority
*   := '\(' p='[A-Z]' '\)'
*     .value = string{ return `(${this.p})`; }
* ws
*   := '[ \t]'+
* RemainingText
*   := text='.*'
*     .value = string{ return this.text.trim(); }
*/

export interface Todo {
  completed: boolean;
  completionDate?: string;
  createdDate?: string;
  priority?: string;
  id?: string;
  text: string;
  projects: string[];
  contexts: string[];
}

function extractProjects(text: string): string[] {
  return (text.match(/\+(\S+)/g) || []).map(s => s.slice(1));
}

function extractContexts(text: string): string[] {
  return (text.match(/@(\S+)/g) || []).map(s => s.slice(1));
}

type Nullable<T> = T | null;
type $$RuleType<T> = () => Nullable<T>;
export interface ASTNodeIntf {
    kind: ASTKinds;
}
export enum ASTKinds {
    TodoLine_1 = "TodoLine_1",
    TodoLine_2 = "TodoLine_2",
    CompletedTodo = "CompletedTodo",
    IncompleteTodo = "IncompleteTodo",
    IncompleteTodo_$0 = "IncompleteTodo_$0",
    IncompleteTodo_$1 = "IncompleteTodo_$1",
    Date = "Date",
    Priority = "Priority",
    ws = "ws",
    RemainingText = "RemainingText",
}
export type TodoLine = TodoLine_1 | TodoLine_2;
export type TodoLine_1 = CompletedTodo;
export type TodoLine_2 = IncompleteTodo;
export class CompletedTodo {
    public kind: ASTKinds.CompletedTodo = ASTKinds.CompletedTodo;
    public completionDate: Date;
    public createdDate: Date;
    public text: RemainingText;
    public value: Todo;
    constructor(completionDate: Date, createdDate: Date, text: RemainingText){
        this.completionDate = completionDate;
        this.createdDate = createdDate;
        this.text = text;
        this.value = ((): Todo => {
        return {
        completed: true,
        completionDate: completionDate.value,
        createdDate: createdDate.value,
        text: text.value,
        projects: extractProjects(text.value),
        contexts: extractContexts(text.value),
        priority: undefined,
        id: undefined
      };
        })();
    }
}
export class IncompleteTodo {
    public kind: ASTKinds.IncompleteTodo = ASTKinds.IncompleteTodo;
    public p: Nullable<IncompleteTodo_$0>;
    public c: Nullable<IncompleteTodo_$1>;
    public text: RemainingText;
    public value: Todo;
    constructor(p: Nullable<IncompleteTodo_$0>, c: Nullable<IncompleteTodo_$1>, text: RemainingText){
        this.p = p;
        this.c = c;
        this.text = text;
        this.value = ((): Todo => {
        return {
        completed: false,
        priority: p?.priority.value,
        createdDate: c?.createdDate.value,
        text: text.value,
        projects: extractProjects(text.value),
        contexts: extractContexts(text.value),
        completionDate: undefined,
        id: undefined
      };
        })();
    }
}
export interface IncompleteTodo_$0 {
    kind: ASTKinds.IncompleteTodo_$0;
    priority: Priority;
}
export interface IncompleteTodo_$1 {
    kind: ASTKinds.IncompleteTodo_$1;
    createdDate: Date;
}
export class Date {
    public kind: ASTKinds.Date = ASTKinds.Date;
    public yyyy: string;
    public mm: string;
    public dd: string;
    public value: string;
    constructor(yyyy: string, mm: string, dd: string){
        this.yyyy = yyyy;
        this.mm = mm;
        this.dd = dd;
        this.value = ((): string => {
        return `${this.yyyy}-${this.mm}-${dd}`;
        })();
    }
}
export class Priority {
    public kind: ASTKinds.Priority = ASTKinds.Priority;
    public p: string;
    public value: string;
    constructor(p: string){
        this.p = p;
        this.value = ((): string => {
        return `(${this.p})`;
        })();
    }
}
export type ws = [string, ...string[]];
export class RemainingText {
    public kind: ASTKinds.RemainingText = ASTKinds.RemainingText;
    public text: string;
    public value: string;
    constructor(text: string){
        this.text = text;
        this.value = ((): string => {
        return this.text.trim();
        })();
    }
}
export class Parser {
    private readonly input: string;
    private pos: PosInfo;
    private negating: boolean = false;
    private memoSafe: boolean = true;
    constructor(input: string) {
        this.pos = {overallPos: 0, line: 1, offset: 0};
        this.input = input;
    }
    public reset(pos: PosInfo) {
        this.pos = pos;
    }
    public finished(): boolean {
        return this.pos.overallPos === this.input.length;
    }
    public clearMemos(): void {
    }
    public matchTodoLine($$dpth: number, $$cr?: ErrorTracker): Nullable<TodoLine> {
        return this.choice<TodoLine>([
            () => this.matchTodoLine_1($$dpth + 1, $$cr),
            () => this.matchTodoLine_2($$dpth + 1, $$cr),
        ]);
    }
    public matchTodoLine_1($$dpth: number, $$cr?: ErrorTracker): Nullable<TodoLine_1> {
        return this.matchCompletedTodo($$dpth + 1, $$cr);
    }
    public matchTodoLine_2($$dpth: number, $$cr?: ErrorTracker): Nullable<TodoLine_2> {
        return this.matchIncompleteTodo($$dpth + 1, $$cr);
    }
    public matchCompletedTodo($$dpth: number, $$cr?: ErrorTracker): Nullable<CompletedTodo> {
        return this.run<CompletedTodo>($$dpth,
            () => {
                let $scope$completionDate: Nullable<Date>;
                let $scope$createdDate: Nullable<Date>;
                let $scope$text: Nullable<RemainingText>;
                let $$res: Nullable<CompletedTodo> = null;
                if (true
                    && this.regexAccept(String.raw`(?:x)`, "", $$dpth + 1, $$cr) !== null
                    && this.loopPlus<ws>(() => this.matchws($$dpth + 1, $$cr)) !== null
                    && ($scope$completionDate = this.matchDate($$dpth + 1, $$cr)) !== null
                    && this.loopPlus<ws>(() => this.matchws($$dpth + 1, $$cr)) !== null
                    && ($scope$createdDate = this.matchDate($$dpth + 1, $$cr)) !== null
                    && this.loopPlus<ws>(() => this.matchws($$dpth + 1, $$cr)) !== null
                    && ($scope$text = this.matchRemainingText($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = new CompletedTodo($scope$completionDate, $scope$createdDate, $scope$text);
                }
                return $$res;
            });
    }
    public matchIncompleteTodo($$dpth: number, $$cr?: ErrorTracker): Nullable<IncompleteTodo> {
        return this.run<IncompleteTodo>($$dpth,
            () => {
                let $scope$p: Nullable<Nullable<IncompleteTodo_$0>>;
                let $scope$c: Nullable<Nullable<IncompleteTodo_$1>>;
                let $scope$text: Nullable<RemainingText>;
                let $$res: Nullable<IncompleteTodo> = null;
                if (true
                    && (($scope$p = this.matchIncompleteTodo_$0($$dpth + 1, $$cr)) || true)
                    && (($scope$c = this.matchIncompleteTodo_$1($$dpth + 1, $$cr)) || true)
                    && ($scope$text = this.matchRemainingText($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = new IncompleteTodo($scope$p, $scope$c, $scope$text);
                }
                return $$res;
            });
    }
    public matchIncompleteTodo_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<IncompleteTodo_$0> {
        return this.run<IncompleteTodo_$0>($$dpth,
            () => {
                let $scope$priority: Nullable<Priority>;
                let $$res: Nullable<IncompleteTodo_$0> = null;
                if (true
                    && ($scope$priority = this.matchPriority($$dpth + 1, $$cr)) !== null
                    && this.loopPlus<ws>(() => this.matchws($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.IncompleteTodo_$0, priority: $scope$priority};
                }
                return $$res;
            });
    }
    public matchIncompleteTodo_$1($$dpth: number, $$cr?: ErrorTracker): Nullable<IncompleteTodo_$1> {
        return this.run<IncompleteTodo_$1>($$dpth,
            () => {
                let $scope$createdDate: Nullable<Date>;
                let $$res: Nullable<IncompleteTodo_$1> = null;
                if (true
                    && ($scope$createdDate = this.matchDate($$dpth + 1, $$cr)) !== null
                    && this.loopPlus<ws>(() => this.matchws($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.IncompleteTodo_$1, createdDate: $scope$createdDate};
                }
                return $$res;
            });
    }
    public matchDate($$dpth: number, $$cr?: ErrorTracker): Nullable<Date> {
        return this.run<Date>($$dpth,
            () => {
                let $scope$yyyy: Nullable<string>;
                let $scope$mm: Nullable<string>;
                let $scope$dd: Nullable<string>;
                let $$res: Nullable<Date> = null;
                if (true
                    && ($scope$yyyy = this.regexAccept(String.raw`(?:[0-9][0-9][0-9][0-9])`, "", $$dpth + 1, $$cr)) !== null
                    && this.regexAccept(String.raw`(?:-)`, "", $$dpth + 1, $$cr) !== null
                    && ($scope$mm = this.regexAccept(String.raw`(?:[0-9][0-9])`, "", $$dpth + 1, $$cr)) !== null
                    && this.regexAccept(String.raw`(?:-)`, "", $$dpth + 1, $$cr) !== null
                    && ($scope$dd = this.regexAccept(String.raw`(?:[0-9][0-9])`, "", $$dpth + 1, $$cr)) !== null
                ) {
                    $$res = new Date($scope$yyyy, $scope$mm, $scope$dd);
                }
                return $$res;
            });
    }
    public matchPriority($$dpth: number, $$cr?: ErrorTracker): Nullable<Priority> {
        return this.run<Priority>($$dpth,
            () => {
                let $scope$p: Nullable<string>;
                let $$res: Nullable<Priority> = null;
                if (true
                    && this.regexAccept(String.raw`(?:\()`, "", $$dpth + 1, $$cr) !== null
                    && ($scope$p = this.regexAccept(String.raw`(?:[A-Z])`, "", $$dpth + 1, $$cr)) !== null
                    && this.regexAccept(String.raw`(?:\))`, "", $$dpth + 1, $$cr) !== null
                ) {
                    $$res = new Priority($scope$p);
                }
                return $$res;
            });
    }
    public matchws($$dpth: number, $$cr?: ErrorTracker): Nullable<ws> {
        return this.loopPlus<string>(() => this.regexAccept(String.raw`(?:[ \t])`, "", $$dpth + 1, $$cr));
    }
    public matchRemainingText($$dpth: number, $$cr?: ErrorTracker): Nullable<RemainingText> {
        return this.run<RemainingText>($$dpth,
            () => {
                let $scope$text: Nullable<string>;
                let $$res: Nullable<RemainingText> = null;
                if (true
                    && ($scope$text = this.regexAccept(String.raw`(?:.*)`, "", $$dpth + 1, $$cr)) !== null
                ) {
                    $$res = new RemainingText($scope$text);
                }
                return $$res;
            });
    }
    public test(): boolean {
        const mrk = this.mark();
        const res = this.matchTodoLine(0);
        const ans = res !== null;
        this.reset(mrk);
        return ans;
    }
    public parse(): ParseResult {
        const mrk = this.mark();
        const res = this.matchTodoLine(0);
        if (res)
            return {ast: res, errs: []};
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.clearMemos();
        this.matchTodoLine(0, rec);
        const err = rec.getErr()
        return {ast: res, errs: err !== null ? [err] : []}
    }
    public mark(): PosInfo {
        return this.pos;
    }
    // @ts-ignore: loopPlus may not be called
    private loopPlus<T>(func: $$RuleType<T>): Nullable<[T, ...T[]]> {
        return this.loop(func, 1, -1) as Nullable<[T, ...T[]]>;
    }
    private loop<T>(func: $$RuleType<T>, lb: number, ub: number): Nullable<T[]> {
        const mrk = this.mark();
        const res: T[] = [];
        while (ub === -1 || res.length < ub) {
            const preMrk = this.mark();
            const t = func();
            if (t === null || this.pos.overallPos === preMrk.overallPos) {
                break;
            }
            res.push(t);
        }
        if (res.length >= lb) {
            return res;
        }
        this.reset(mrk);
        return null;
    }
    private run<T>($$dpth: number, fn: $$RuleType<T>): Nullable<T> {
        const mrk = this.mark();
        const res = fn()
        if (res !== null)
            return res;
        this.reset(mrk);
        return null;
    }
    // @ts-ignore: choice may not be called
    private choice<T>(fns: Array<$$RuleType<T>>): Nullable<T> {
        for (const f of fns) {
            const res = f();
            if (res !== null) {
                return res;
            }
        }
        return null;
    }
    private regexAccept(match: string, mods: string, dpth: number, cr?: ErrorTracker): Nullable<string> {
        return this.run<string>(dpth,
            () => {
                const reg = new RegExp(match, "y" + mods);
                const mrk = this.mark();
                reg.lastIndex = mrk.overallPos;
                const res = this.tryConsume(reg);
                if(cr) {
                    cr.record(mrk, res, {
                        kind: "RegexMatch",
                        // We substring from 3 to len - 1 to strip off the
                        // non-capture group syntax added as a WebKit workaround
                        literal: match.substring(3, match.length - 1),
                        negated: this.negating,
                    });
                }
                return res;
            });
    }
    private tryConsume(reg: RegExp): Nullable<string> {
        const res = reg.exec(this.input);
        if (res) {
            let lineJmp = 0;
            let lind = -1;
            for (let i = 0; i < res[0].length; ++i) {
                if (res[0][i] === "\n") {
                    ++lineJmp;
                    lind = i;
                }
            }
            this.pos = {
                overallPos: reg.lastIndex,
                line: this.pos.line + lineJmp,
                offset: lind === -1 ? this.pos.offset + res[0].length : (res[0].length - lind - 1)
            };
            return res[0];
        }
        return null;
    }
    // @ts-ignore: noConsume may not be called
    private noConsume<T>(fn: $$RuleType<T>): Nullable<T> {
        const mrk = this.mark();
        const res = fn();
        this.reset(mrk);
        return res;
    }
    // @ts-ignore: negate may not be called
    private negate<T>(fn: $$RuleType<T>): Nullable<boolean> {
        const mrk = this.mark();
        const oneg = this.negating;
        this.negating = !oneg;
        const res = fn();
        this.negating = oneg;
        this.reset(mrk);
        return res === null ? true : null;
    }
    // @ts-ignore: Memoise may not be used
    private memoise<K>(rule: $$RuleType<K>, memo: Map<number, [Nullable<K>, PosInfo]>): Nullable<K> {
        const $scope$pos = this.mark();
        const $scope$memoRes = memo.get($scope$pos.overallPos);
        if(this.memoSafe && $scope$memoRes !== undefined) {
        this.reset($scope$memoRes[1]);
        return $scope$memoRes[0];
        }
        const $scope$result = rule();
        if(this.memoSafe)
        memo.set($scope$pos.overallPos, [$scope$result, this.mark()]);
        return $scope$result;
    }
}
export function parse(s: string): ParseResult {
    const p = new Parser(s);
    return p.parse();
}
export interface ParseResult {
    ast: Nullable<TodoLine>;
    errs: SyntaxErr[];
}
export interface PosInfo {
    readonly overallPos: number;
    readonly line: number;
    readonly offset: number;
}
export interface RegexMatch {
    readonly kind: "RegexMatch";
    readonly negated: boolean;
    readonly literal: string;
}
export type EOFMatch = { kind: "EOF"; negated: boolean };
export type MatchAttempt = RegexMatch | EOFMatch;
export class SyntaxErr {
    public pos: PosInfo;
    public expmatches: MatchAttempt[];
    constructor(pos: PosInfo, expmatches: MatchAttempt[]) {
        this.pos = pos;
        this.expmatches = [...expmatches];
    }
    public toString(): string {
        return `Syntax Error at line ${this.pos.line}:${this.pos.offset}. Expected one of ${this.expmatches.map(x => x.kind === "EOF" ? " EOF" : ` ${x.negated ? 'not ': ''}'${x.literal}'`)}`;
    }
}
class ErrorTracker {
    private mxpos: PosInfo = {overallPos: -1, line: -1, offset: -1};
    private regexset: Set<string> = new Set();
    private pmatches: MatchAttempt[] = [];
    public record(pos: PosInfo, result: any, att: MatchAttempt) {
        if ((result === null) === att.negated)
            return;
        if (pos.overallPos > this.mxpos.overallPos) {
            this.mxpos = pos;
            this.pmatches = [];
            this.regexset.clear()
        }
        if (this.mxpos.overallPos === pos.overallPos) {
            if(att.kind === "RegexMatch") {
                if(!this.regexset.has(att.literal))
                    this.pmatches.push(att);
                this.regexset.add(att.literal);
            } else {
                this.pmatches.push(att);
            }
        }
    }
    public getErr(): SyntaxErr | null {
        if (this.mxpos.overallPos !== -1)
            return new SyntaxErr(this.mxpos, this.pmatches);
        return null;
    }
}