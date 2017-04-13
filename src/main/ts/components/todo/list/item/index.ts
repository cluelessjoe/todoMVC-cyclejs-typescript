import {Stream} from "xstream";
import {DOMSource, VNode} from "@cycle/dom";

import {Todo} from "../model";
import {Intent} from "../intent";
import {intents} from "./intent";
import {model} from "./model";
import {view} from "./view";


export type TodoListItemProps = {
    todo: Todo
}

export type Sources = {
    DOM: DOMSource,
    props$: Stream<TodoListItemProps>,
};
export type Sinks = {
    DOM: Stream<VNode>,
    actions$: Stream<Intent>
};

function TodoListItem(sources: Sources): Sinks {
    const intent$ = intents(sources);

    const state$ = model(intent$);

    const vdom$ = view(state$, sources.props$);

    return {
        DOM: vdom$,
        actions$: intent$
    };
}

export default TodoListItem;
