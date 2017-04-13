import isolate from "@cycle/isolate";
import {List} from "immutable";
import {GenericInput, HistoryInput} from "@cycle/history";
import {DOMSource} from "@cycle/dom";
import xs, {Stream} from "xstream";
import {VNode} from "snabbdom/vnode";

import TodoListItem, {Sinks as ItemSinks} from "./item/index";
import {model, State} from "./model";
import {view} from "./view";
import {intent, Intent} from "./intent";

export const NEW_TODO_CLASS = ".new-todo";
export const TOGGLE_ALL = 'toggle-all';
export const TOGGLE_ALL_CLASS = `.${TOGGLE_ALL}`;
export const TOGGLE_ALL_SELECTOR = `#${TOGGLE_ALL}${TOGGLE_ALL_CLASS}`;
export const CLEAR_COMPLETED_CLASS = '.clear-completed';

export type Sources = {
    DOM: DOMSource,
    History: any,
    initialState$: Stream<State>
};
export type Sinks = {
    DOM: Stream<VNode>,
    History: Stream<HistoryInput | GenericInput | string>,
    state$: Stream<State>
};


export class Route {
    constructor(readonly label: string, readonly hash: string) {
    }
}

export const ROUTE_ALL = new Route("All", "#/");
export const ROUTE_ACTIVE = new Route("Active", "#/active");
export const ROUTE_COMPLETED = new Route("Completed", "#/completed");
export const ROUTE_DEFAULT = ROUTE_ALL;

export function TodoList(sources: Sources): Sinks {
    const intentProxy$ = xs.create<Intent>();

    const intent$ = intent(sources);

    const state$ = model(sources.initialState$, intentProxy$);

    const compos$: Stream<List<ItemSinks>> = state$
        .map(state => state.displayed)
        .map(todos => todos
            .map((todo, index) => isolate(TodoListItem, todo.id)({
                DOM: sources.DOM,
                props$: xs.of({
                    'todo': todo
                })
            })).toList());

    const actionsFromSinks = compos$
        .map(todoItemsSinks => xs.merge(...todoItemsSinks.map(sink => sink.actions$).toArray()))
        .flatten();

    const allActions$ = xs.merge(intent$, actionsFromSinks);

    intentProxy$.imitate(allActions$);

    const todoItemSinks$: Stream<VNode[]> = compos$
        .map(todoItemsSinks => xs.combine(...todoItemsSinks.map(sink => sink.DOM).toArray()))
        .flatten();

    let vdom$: Stream<VNode> = view(state$, todoItemSinks$);

    return {
        DOM: vdom$,
        History: state$.map(state => state.display.hash),
        state$: state$
    };
}

export default TodoList;