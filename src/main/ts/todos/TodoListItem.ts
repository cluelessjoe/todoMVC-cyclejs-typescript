import {Stream} from "xstream";
import {button, div, DOMSource, label, VNode, input} from "@cycle/dom";
import {Todo} from "./Todo";
import {Action} from "../Action";
import {TodoDeleted} from "./TodoAction";

export const DELETED_CLASS = ".deleted";
export const CLICK_EVENT = "click";

export type TodoListItemProps = {
    todo: Todo,
}

export type Sources = {
    DOM: DOMSource,
    props$: Stream<TodoListItemProps>,
};
export type Sinks = {
    DOM: Stream<VNode>,
    actions$: Stream<Action>
};


function newTodoDeletedIntent(sources: Sources): Stream<Action> {
    return sources.DOM.select(DELETED_CLASS)
        .events(CLICK_EVENT)
        .map(ev => ev as any)
        .map(ev => String(ev.target.value).trim())
        .map(v => new Action(TodoDeleted, v));
}

function TodoListItem(sources: Sources): Sinks {
    const todoDeleted$ = newTodoDeletedIntent(sources);

    return {
        DOM: sources.props$.map(props => div(".view", [
            input(".toggle", {attrs: {type: "checkbox"}}),
            label(props.todo.text),
            button('.destroy')
        ])),
        actions$: todoDeleted$
    };
}
export default TodoListItem;
