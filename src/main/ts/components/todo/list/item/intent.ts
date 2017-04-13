import xs, {Stream} from "xstream";

import {CompleteState, CompleteToggleChanged, Intent, TodoDeleted, TodoUpdated} from "../intent";
import {ENTER_KEY, ESC_KEY, KEY_UP_EVENT} from "../../../../dom/Keys";
import {BLUR_EVENT, CHANGE_EVENT, CLICK_EVENT, DOUBLE_CLICK_EVENT} from "../../../../dom/Events";
import {Sources} from "./index";
import {COMPLETED_TOGGLE_CLASS, DELETED_CLASS, EDIT_CLASS, LABEL} from "./view";

export const EditStarted = "EditStarted";
export const EditEnded = "EditEnded";

export function intents(sources: Sources): Stream<Intent> {
    const editInputKey$ = sources.DOM.select(EDIT_CLASS)
        .events(KEY_UP_EVENT)
        .map(ev => ev as KeyboardEvent);

    const editInputEnterKey$ = editInputKey$.filter(ev => ev.keyCode === ENTER_KEY);

    const valueUpdated$ = editInputEnterKey$
        .map(ev => String((ev.target as HTMLInputElement).value).trim());

    const deleteIntent$ = xs.merge(
        sources.DOM.select(DELETED_CLASS).events(CLICK_EVENT),
        valueUpdated$.filter(val => val.length === 0)
    );

    const updateTodo$ = xs.combine(valueUpdated$.filter(val => val.length !== 0), sources.props$)
        .map(valAndProps => new Intent(TodoUpdated, {
            text: valAndProps[0],
            todo: valAndProps[1].todo
        }));

    const deleteTodo$ = xs.combine(deleteIntent$, sources.props$)
        .map(evAndProps => new Intent(TodoDeleted, evAndProps[1].todo));

    const completeToggleClicked$ = sources.DOM.select(COMPLETED_TOGGLE_CLASS)
        .events(CHANGE_EVENT)
        .map(ev => (ev as any).target.checked);

    const toggleCompleteTodo$ = xs.combine(completeToggleClicked$, sources.props$)
        .map(checkedAndProps => new Intent(CompleteToggleChanged, {
            state: checkedAndProps[0] ? CompleteState.COMPLETED : CompleteState.UNCOMPLETED,
            todo: checkedAndProps[1].todo
        }));

    const startEditing$ = sources.DOM.select(LABEL)
        .events(DOUBLE_CLICK_EVENT)
        .mapTo(new Intent(EditStarted, ""));

    const blurEditInput$ = sources.DOM.select(EDIT_CLASS).events(BLUR_EVENT);

    const editInputEscKey$ = editInputKey$.filter(ev => ev.keyCode === ESC_KEY);

    const stopEditing$ = xs.merge(blurEditInput$, editInputEnterKey$, editInputEscKey$)
        .mapTo(new Intent(EditEnded, ""));

    return xs.merge(
        deleteTodo$,
        updateTodo$,
        toggleCompleteTodo$,
        startEditing$,
        stopEditing$
    )
}
