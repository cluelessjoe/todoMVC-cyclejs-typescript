import {ACTIVE_PATH, CLEAR_COMPLETED_CLASS, COMPLETED_PATH, NEW_TODO_CLASS, Sources} from "./index";
import dropRepeats from "xstream/extra/dropRepeats";
import xs, {Stream} from "xstream";

import {ENTER_KEY, KEY_DOWN_EVENT} from "../../../dom/Keys";
import {CLICK_EVENT} from "../../../dom/Events";

export const NewTodoAdded = "NewTodoAdded";
export const TodoDeleted = "TodoDeleted";
export const CompleteToggleChanged = "CompleteToggleChanged";
export const CompleteAllToggleChanged = "CompleteAllToggleChanged";
export enum CompleteState {COMPLETED, UNCOMPLETED}
export const RouteChanged = "RouteChanged";
export enum RouteState {ALL, ACTIVE, COMPLETED}

export const ClearCompleted = "ClearCompleted";

export class Intent {
    constructor(readonly type: string, readonly value: Object) {
    }
}

export function intent(sources: Sources) {
    return xs.merge(
        clearCompleted(sources),
        newTodoAddedIntent(sources),
        completeAllIntent(sources),
        routeChangedIntent(sources)
    );
}


function completeAllIntent(sources: Sources): Stream<Intent> {
    return sources.DOM.select("#toggle-all")
        .events(CLICK_EVENT)
        .map(ev => (ev as any).target.checked)
        .map(checked => new Intent(CompleteAllToggleChanged, (checked ? CompleteState.COMPLETED : CompleteState.UNCOMPLETED)));
}

function routeChangedIntent(sources: Sources): Stream<Intent> {
    return sources.History
        .startWith({pathname: '/'})
        .map(location => location.hash)
        .compose(dropRepeats())//FIXME : try without
        .debug("location")
        .map(payload => {
            console.log("other " + payload);
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
