import xs, {Stream} from "xstream";
import {button, div, DOMSource, label, VNode, input} from "@cycle/dom";
import {Todo} from "./Todo";
import {Action} from "../Action";
import {TodoDeleted} from "./TodoAction";

export const DELETED_CLASS = ".destroy";
export const CLICK_EVENT = "click";

export type TodoListItemProps = {
    todo: Todo
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
    const deleteClicked$ = sources.DOM.select(DELETED_CLASS)
        .events(CLICK_EVENT);
    
    return xs.combine(deleteClicked$, sources.props$)
        .map(clickedAndProps => new Action(TodoDeleted, clickedAndProps[1].todo))
}

function TodoListItem(sources: Sources): Sinks {
    const todoDeleted$ = newTodoDeletedIntent(sources);

    return {
        DOM: sources.props$.map(props => div(".view", [
            input(".toggle", {attrs: {type: "checkbox"}}),
            label(props.todo.text),
            button(DELETED_CLASS)
        ])),
        actions$: todoDeleted$
    };
}
export default TodoListItem;
