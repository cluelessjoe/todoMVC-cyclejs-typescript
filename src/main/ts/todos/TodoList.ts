import isolate from "@cycle/isolate";
import {List} from "immutable";
import {GenericInput, HistoryInput} from "@cycle/history";
import dropRepeats from "xstream/extra/dropRepeats";
import {div, DOMSource, h1, header, input, label, section, ul, footer, span, strong, li, a, button} from "@cycle/dom";
import xs, {Stream} from "xstream";
import {VNode} from "snabbdom/vnode";

import {TodoListState} from "./TodoListState";
import {Todo} from "./Todo";
import TodoListItem, {Sinks as ItemSinks} from "./TodoListItem";
import {Action} from "../Action";
import {ENTER_KEY, KEY_DOWN_EVENT, KEY_UP_EVENT} from "../Keys";
import {CLICK_EVENT} from "../Events";
import {ClearCompleted, CompleteAllToggleChanged, CompleteState, CompleteToggleChanged, NewTodoAdded, RouteChanged, RouteState, TodoDeleted} from "./TodoAction";

export {ENTER_KEY, KEY_DOWN_EVENT, KEY_UP_EVENT};//FIXME : why is this needed ?
export const NEW_TODO_CLASS = ".new-todo";
export const TOGGLE_ALL = 'toggle-all';
export const TOGGLE_ALL_CLASS = '.' + TOGGLE_ALL;
export const STORAGE_KEY = 'todos-cyclejs';
export const CLEAR_COMPLETED_CLASS = '.clear-completed';

export type Sources = {
    DOM: DOMSource,
    storage: any,
    History: any
};
export type Sinks = {
    DOM: Stream<VNode>,
    storage: Stream<{ action: string, key: string, value?: string }>,
    History: Stream<HistoryInput | GenericInput | string>
};

const COMPLETED_PATH = "/completed";
const ACTIVE_PATH = "/active";

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
        .filter(value => value !== "")
        .map(v => new Action(NewTodoAdded, v));
}

export const storageIntent: (Sources) => Stream<TodoListState> = (sources: Sources) => {
    return sources.storage.local
        .getItem(STORAGE_KEY)
        .map(storeEntry => JSON.parse(storeEntry) || {})
        .map(storedJsonTodos => new TodoListState(List<Todo>(storedJsonTodos.todos)))
        .take(1)
        .startWith(new TodoListState(List<Todo>()));
};

function completeAllIntent(sources: Sources): Stream<Action> {
    return sources.DOM.select("#toggle-all")
        .events(CLICK_EVENT)
        .map(ev => (ev as any).target.checked)
        .map(checked => new Action(CompleteAllToggleChanged, (checked ? CompleteState.COMPLETED : CompleteState.UNCOMPLETED)));
}

function routeChangedIntent(sources: Sources): Stream<Action> {
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
            return new Action(RouteChanged, state);
        })
}

export function TodoList(sources: Sources): Sinks {

    const clearCompleted$ = clearCompleted(sources);

    const routeChanged$ = routeChangedIntent(sources);

    const newTodoAdded$ = newTodoAddedIntent(sources);

    const completeAllIntent$ = completeAllIntent(sources);

    const action$ = xs.merge(clearCompleted$, newTodoAdded$, completeAllIntent$, routeChanged$);

    const actionProxy$ = xs.create<Action>();

    const storedTodos$: Stream<TodoListState> = storageIntent(sources);

    const state$ = model(storedTodos$, actionProxy$);

    const compos$: Stream<List<ItemSinks>> = state$
        .map(state => state.displayed)
        .map(todos => todos
            .map((todo, index) => isolate(TodoListItem, "todo-" + index)({
                DOM: sources.DOM,
                props$: xs.of({
                    'todo': todo
                })
            })).toList());

    const actionsFromSinks = compos$
        .map(todoItemsSinks => xs.merge(...todoItemsSinks.map(sink => sink.actions$).toArray()))
        .flatten();

    const allActions$ = xs.merge(action$, actionsFromSinks);

    actionProxy$.imitate(allActions$);

    const todoItemSinks$: Stream<VNode[]> = compos$
        .map(todoItemsSinks => xs.combine(...todoItemsSinks.map(sink => sink.DOM).toArray()))
        .flatten();

    let vdom$: Stream<VNode> = xs.combine(state$, todoItemSinks$)
        .map(itemVdomAndTodos => {
            const state: TodoListState = itemVdomAndTodos[0];
            const itemsVdom = itemVdomAndTodos[1];

            function addFilter(href: string, label: string, isSelected: boolean): VNode {
                //FIXME : consolidate 
                if (isSelected) {
                    return li(a({
                        props: {
                            href: href
                        },
                        class: {
                            selected: true
                        }
                    }, label));
                } else {
                    return li(a({
                        props: {
                            href: href
                        }
                    }, label));
                }
            };
            return div([
                    header(".header", [
                        h1('todos'),
                        input(NEW_TODO_CLASS, {
                            props: {
                                type: 'text',
                                placeholder: 'What needs to be done?',
                                autofocus: true,
                                name: 'newTodo'
                            },
                            hook: {
                                update: (oldVNode, {elm}) => {
                                    elm.value = '';
                                },
                            },
                        })]
                    ),
                    section(".main", [
                        input("#" + TOGGLE_ALL + TOGGLE_ALL_CLASS, {
                            attrs: {
                                type: 'checkbox',
                                checked: state.allCompleted
                            },
                            hook: {
                                update: (oldVNode, {elm}) => {
                                    elm.checked = state.allCompleted;
                                },
                            }
                        }),
                        label({
                            attrs: {
                                for: 'toggle-all'
                            }
                        }),
                        ul(".todo-list", itemsVdom)]
                    ),
                    footer(".footer", [
                        span(".todo-count", [
                            strong(state.count),
                            " item left"]),
                        ul('.filters', [
                            addFilter("/", "All", state.isDisplayAll()),
                            addFilter(ACTIVE_PATH, "Active", state.isDisplayActive()),
                            addFilter(COMPLETED_PATH, "Completed", state.isDisplayCompleted()),
                        ]),
                        button(CLEAR_COMPLETED_CLASS, 'Clear completed (' + state.completedCount + ')')
                    ])
                ]
            );
        });

    const storage$ = state$
        .map(t => JSON.stringify({
            todos: t.todos.toArray()
        }))
        .map(jsonTodos => {
            return {
                action: 'setItem',
                key: STORAGE_KEY,
                value: jsonTodos
            };
        });

    return {
        DOM: vdom$,
        storage: storage$,
        History: xs.empty()
    };
}

type UpdateCompleteStateFunction = (TodoListState, Todo) => TodoListState;
type Reducer = (TodoListState) => TodoListState;
type CompleteToggleChangePayload = {
    state: CompleteState,
    todo: Todo
}

function mapToReducers(actions$: Stream<Action>): Stream<Reducer> {
    const addTodoReducer$ = filterActionWithType(actions$, NewTodoAdded)
        .map(action => (state) => state.add(action.value));
    const deleteTodoReducer$ = filterActionWithType(actions$, TodoDeleted)
        .map(action => (state) => state.drop(action.value));
    const completedTodoReducer$ = mapCompleteToggleChanged(actions$, CompleteState.COMPLETED, (state, todo) => state.complete(todo));
    const uncompletedTodoReducer$ = mapCompleteToggleChanged(actions$, CompleteState.UNCOMPLETED, (state, todo) => state.uncomplete(todo));
    const completeAllTodoReducer$ = mapCompleteAllToggleChanged(actions$, CompleteState.COMPLETED, state => state.completeAll());
    const uncompleteAllTodoReducer$ = mapCompleteAllToggleChanged(actions$, CompleteState.UNCOMPLETED, state => state.uncompleteAll());
    const clearCompletedReducer$ = filterActionWithType(actions$, ClearCompleted)
        .map(action => (state) => state.clearCompleted());
    const activeRouteReducers$ = mapRouteChanged(actions$, RouteState.ACTIVE, state => state.displayActive());
    const completeRouteReducers$ = mapRouteChanged(actions$, RouteState.COMPLETED, state => state.displayCompleted());
    const allRouteReducers$ = mapRouteChanged(actions$, RouteState.ALL, state => state.displayAll());

    return xs.merge(
        addTodoReducer$,
        deleteTodoReducer$,
        completedTodoReducer$,
        uncompletedTodoReducer$,
        completeAllTodoReducer$,
        uncompleteAllTodoReducer$,
        clearCompletedReducer$,
        activeRouteReducers$,
        completeRouteReducers$,
        allRouteReducers$
    );
}

function mapRouteChanged(actions$: Stream<Action>, state: RouteState, reducer: Reducer): Stream<Reducer> {
    return filterActionWithType(actions$, RouteChanged)
        .filter(action => action.value === state)
        .mapTo(reducer);
}

function mapCompleteToggleChanged(actions$: Stream<Action>, state: CompleteState, stateUpdateFn: UpdateCompleteStateFunction): Stream<Reducer> {
    return filterActionWithType(actions$, CompleteToggleChanged)
        .map(action => action.value as CompleteToggleChangePayload)
        .filter(payload => payload.state === state)
        .map(payload => (state) => stateUpdateFn(state, payload.todo));
}

function mapCompleteAllToggleChanged(actions$: Stream<Action>, state: CompleteState, reducer: Reducer): Stream<Reducer> {
    return filterActionWithType(actions$, CompleteAllToggleChanged)
        .filter(action => action.value === state)
        .mapTo(reducer);
}

function filterActionWithType(actions$: Stream<Action>, type: string): Stream<Action> {
    return actions$.filter(action => action.type === type);
}

function model(state$: Stream<TodoListState>, actions$: Stream<Action>): Stream<TodoListState> {
    const reducers$ = mapToReducers(actions$);
    return state$
        .map(initState => reducers$
            .debug("reducers")
            .fold((todos, reducer) => reducer(todos), initState))
        .flatten()
        .remember()
        ;
}

export default TodoList;