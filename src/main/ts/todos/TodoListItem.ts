import xs, {Stream} from "xstream";
import {button, div, DOMSource, label, VNode, input, li} from "@cycle/dom";
import {Todo} from "./Todo";
import {Action} from "../Action";
import {TodoDeleted, TodosCompleted, TodosUncompleted} from "./TodoAction";

export const DELETED_CLASS = ".destroy";
export const COMPLETED_TOGGLE_CLASS = ".toggle";
export const CLICK_EVENT = "click";
export const CHANGE_EVENT = "change";


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

function intents(sources: Sources): Stream<string> {
    return xs.merge(
        sources.DOM.select(DELETED_CLASS)
            .events(CLICK_EVENT)
            .map(ev => TodoDeleted),
        sources.DOM.select(COMPLETED_TOGGLE_CLASS)
            .events(CHANGE_EVENT)
            .map(ev => (ev as any).target.checked)
            .map(checked => checked ? TodosCompleted : TodosUncompleted)
    )
}

function TodoListItem(sources: Sources): Sinks {
    const intents$ = intents(sources);

    const actions$ = xs.combine(intents$, sources.props$)
        .map(actionAndProps => new Action(actionAndProps[0], actionAndProps[1].todo));

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
