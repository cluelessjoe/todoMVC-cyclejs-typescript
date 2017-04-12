import xs, {Stream} from "xstream";
import {button, div, DOMSource, label, VNode, input, li} from "@cycle/dom";
import {Todo} from "./Todo";
import {Action} from "../Action";
import {CompleteState, CompleteToggleChanged, TodoDeleted} from "./TodoAction";
import {CLICK_EVENT, CHANGE_EVENT} from "../Events";

export const DELETED_CLASS = ".destroy";
export const COMPLETED_TOGGLE_CLASS = ".toggle";

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

function intents(sources: Sources): Stream<Action> {
    const deleteClicked$ = sources.DOM.select(DELETED_CLASS)
        .events(CLICK_EVENT);

    const deleteTodo$ = xs.combine(deleteClicked$, sources.props$)
        .map(evAndProps => new Action(TodoDeleted, evAndProps[1].todo));

    const completeToggleClicked$ = sources.DOM.select(COMPLETED_TOGGLE_CLASS)
        .events(CHANGE_EVENT)
        .map(ev => (ev as any).target.checked);

    const toggleCompleteTodo$ = xs.combine(completeToggleClicked$, sources.props$)
        .map(checkedAndProps => new Action(CompleteToggleChanged, {
            state: checkedAndProps[0] ? CompleteState.COMPLETED : CompleteState.UNCOMPLETED,
            todo: checkedAndProps[1].todo
        }));

    return xs.merge(deleteTodo$, toggleCompleteTodo$)
}

function TodoListItem(sources: Sources): Sinks {
    const actions$ = intents(sources);

    return {
        DOM: sources.props$.map(props => {
            const text = props.todo.text;
            const completed = props.todo.completed ? ".completed" : "";
            return li(completed, [
                div(".view", [
                    input(COMPLETED_TOGGLE_CLASS, {
                        attrs: {
                            type: "checkbox",
                            checked: props.todo.completed
                        }
                    }),
                    label(text),
                    button(DELETED_CLASS)
                ])
            ]);
        }),
        actions$: actions$
    };
}
export default TodoListItem;
