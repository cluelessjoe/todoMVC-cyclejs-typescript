import {ACTIVE_PATH, CLEAR_COMPLETED_CLASS, COMPLETED_PATH, NEW_TODO_CLASS, Sources} from "./index";
import dropRepeats from "xstream/extra/dropRepeats";
import xs, {Stream} from "xstream";

import {Intent} from "../../utils/Action";
import {ENTER_KEY, KEY_DOWN_EVENT} from "../../dom/Keys";
import {CLICK_EVENT} from "../../dom/Events";

export const NewTodoAdded = "NewTodoAdded";
export const TodoDeleted = "TodoDeleted";
export const CompleteToggleChanged = "CompleteToggleChanged";
export const CompleteAllToggleChanged = "CompleteAllToggleChanged";
export enum CompleteState {COMPLETED, UNCOMPLETED}
export const RouteChanged = "RouteChanged";
export enum RouteState {ALL, ACTIVE, COMPLETED}
;
export const ClearCompleted = "ClearCompleted";

export function intent(sources: Sources) {
    const clearCompleted$ = clearCompleted(sources);

    const routeChanged$ = routeChangedIntent(sources);

    const newTodoAdded$ = newTodoAddedIntent(sources);

    const completeAllIntent$ = completeAllIntent(sources);

    const action$ = xs.merge(clearCompleted$, newTodoAdded$, completeAllIntent$, routeChanged$);

    return action$;
};

function completeAllIntent(sources: Sources): Stream<Intent> {
    return sources.DOM.select("#toggle-all")
        .events(CLICK_EVENT)
        .map(ev => (ev as any).target.checked)
        .map(checked => new Intent(CompleteAllToggleChanged, (checked ? CompleteState.COMPLETED : CompleteState.UNCOMPLETED)));
}

function routeChangedIntent(sources: Sources): Stream<Intent> {
    return sources.History
        .startWith({pathname: '/'})
        .map(location => location.pathname)
        .compose(dropRepeats())//FIXME : try without
        .map(payload => {
            let state;
            if (COMPLETED_PATH === payload) {
                state = RouteState.COMPLETED;
            } else if (ACTIVE_PATH === payload) {
                state = RouteState.ACTIVE;
            } else {
                state = RouteState.ALL;
            }
            return new Intent(RouteChanged, state);
        })
}

function clearCompleted(sources: Sources) {
    return sources.DOM.select(CLEAR_COMPLETED_CLASS)
        .events(CLICK_EVENT)
        .map(e => new Intent(ClearCompleted, null))
}

export function newTodoAddedIntent(sources: Sources): Stream<Intent> {
    return sources.DOM.select(NEW_TODO_CLASS)
        .events(KEY_DOWN_EVENT)
        .map(ev => ev as KeyboardEvent)
        .filter(ev => ev.keyCode === ENTER_KEY)
        .map(ev => String((ev.target as HTMLInputElement).value).trim())
        .filter(value => value !== "")
        .map(v => new Intent(NewTodoAdded, v));
}
