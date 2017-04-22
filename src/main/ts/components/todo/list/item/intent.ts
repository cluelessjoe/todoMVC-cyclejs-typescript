import xs, {Stream} from 'xstream';

import {CompleteState, CompleteToggleChanged, Action, TodoDeleted, TodoUpdated} from '../intent';
import {ENTER_KEY, ESC_KEY, KEY_UP_EVENT} from '../../../../dom/Keys';
import {BLUR_EVENT, CHANGE_EVENT, CLICK_EVENT, DOUBLE_CLICK_EVENT} from '../../../../dom/Events';
import {Sources} from './index';
import {COMPLETED_TOGGLE_CLASS, DELETED_CLASS, EDIT_CLASS, LABEL} from './view';

export const EditStarted = 'EditStarted';
export const EditEnded = 'EditEnded';

export function intents(sources: Sources): Stream<Action> {
    const editInputKey$ = sources.DOM.select(EDIT_CLASS)
        .events(KEY_UP_EVENT)
        .map(ev => ev as KeyboardEvent)
        .debug("1");

    const editInputEnterKey$ = editInputKey$.filter(ev => ev.keyCode === ENTER_KEY).debug("2");

    const valueUpdated$ = editInputEnterKey$
        .map(ev => String((ev.target as HTMLInputElement).value).trim());

    const deleteIntent$ = xs.merge(
        sources.DOM.select(DELETED_CLASS).events(CLICK_EVENT),
        valueUpdated$.filter(val => val.length === 0)
    );

    const updateTodo$ = valueUpdated$
        .filter(val => val.length !== 0)
        .map(value => new Action(TodoUpdated, value));

    const deleteTodo$ = xs.combine(deleteIntent$, sources.props$)
        .map(evAndProps => new Action(TodoDeleted, evAndProps[1].todo));

    const completeToggleClicked$ = sources.DOM.select(COMPLETED_TOGGLE_CLASS)
        .events(CHANGE_EVENT)
        .map(ev => (ev as any).target.checked);

    const toggleCompleteTodo$ = completeToggleClicked$
        .map(checked => new Action(CompleteToggleChanged, checked ? CompleteState.COMPLETED : CompleteState.UNCOMPLETED));

    const startEditing$ = sources.DOM.select(LABEL)
        .events(DOUBLE_CLICK_EVENT)
        .mapTo(new Action(EditStarted, ''));

    const blurEditInput$ = sources.DOM.select(EDIT_CLASS).events(BLUR_EVENT);

    const editInputEscKey$ = editInputKey$.filter(ev => ev.keyCode === ESC_KEY);

    const stopEditing$ = xs.merge(blurEditInput$, editInputEnterKey$, editInputEscKey$)
        .debug("3")
        .mapTo(new Action(EditEnded, ''));

    return xs.merge(
        deleteTodo$,
        updateTodo$,
        toggleCompleteTodo$,
        startEditing$,
        stopEditing$
    )
}
