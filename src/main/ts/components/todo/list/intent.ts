import {CLEAR_COMPLETED_CLASS, NEW_TODO_CLASS, ROUTE_ACTIVE, ROUTE_COMPLETED, ROUTE_DEFAULT, Sources} from './index';
import dropRepeats from 'xstream/extra/dropRepeats';
import xs, {Stream} from 'xstream';

import {ENTER_KEY, KEY_DOWN_EVENT} from '../../../dom/Keys';
import {CLICK_EVENT} from '../../../dom/Events';

export const NewTodoAdded = 'NewTodoAdded';
export const TodoDeleted = 'TodoDeleted';
export const TodoUpdated = 'TodoUpdated';
export const CompleteToggleChanged = 'CompleteToggleChanged'; //FIXME Toggle in the name
export const CompleteAllToggleChanged = 'CompleteAllToggleChanged'; //FIXME Toggle in the name
export enum CompleteState {COMPLETED, UNCOMPLETED}
export const RouteChanged = 'RouteChanged';
export enum RouteState {ALL, ACTIVE, COMPLETED}

export const ClearCompleted = 'ClearCompleted';

export class Action {
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

function completeAllIntent(sources: Sources): Stream<Action> {
    return sources.DOM.select('#toggle-all')
        .events(CLICK_EVENT)
        .map(ev => (ev as any).target.checked)
        .map(checked => new Action(CompleteAllToggleChanged, (checked ? CompleteState.COMPLETED : CompleteState.UNCOMPLETED)));
}

function routeChangedIntent(sources: Sources): Stream<Action> {
    return sources.History
        .startWith({pathname: ROUTE_DEFAULT.hash})
        .map(location => location.hash)
        .compose(dropRepeats())
        .map(payload => {
            let state;
            if (ROUTE_COMPLETED.hash === payload) {
                state = RouteState.COMPLETED;
            } else if (ROUTE_ACTIVE.hash === payload) {
                state = RouteState.ACTIVE;
            } else {
                state = RouteState.ALL;
            }
            return new Action(RouteChanged, state);
        })
}

function clearCompleted(sources: Sources) {
    return sources.DOM.select(CLEAR_COMPLETED_CLASS)
        .events(CLICK_EVENT)
        .map(e => new Action(ClearCompleted, null))
}

export function newTodoAddedIntent(sources: Sources): Stream<Action> {
    return sources.DOM.select(NEW_TODO_CLASS)
        .events(KEY_DOWN_EVENT)
        .map(ev => ev as KeyboardEvent)
        .filter(ev => ev.keyCode === ENTER_KEY)
        .map(ev => String((ev.target as HTMLInputElement).value).trim())
        .filter(value => value !== '')
        .map(v => new Action(NewTodoAdded, v));
}
