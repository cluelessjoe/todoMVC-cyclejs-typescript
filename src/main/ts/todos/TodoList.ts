import xs, {Stream} from "xstream";
import {div, DOMSource, h1, header, input, section, ul, VNode, footer, label} from "@cycle/dom";
import {CompleteAllToggleChanged, CompleteState, CompleteToggleChanged, NewTodoAdded, TodoDeleted} from "./TodoAction";
import {TodoListState} from "./TodoListState";
import {Todo} from "./Todo";
import {List} from "immutable";
import TodoListItem, {Sinks as ItemSinks} from "./TodoListItem";
import isolate from "@cycle/isolate";
import {Action} from "../Action";
import {ENTER_KEY, KEY_DOWN_EVENT, KEY_UP_EVENT} from "../Keys";
import {CLICK_EVENT} from "../Events";

export {ENTER_KEY, KEY_DOWN_EVENT, KEY_UP_EVENT};//FIXME : needed ?
export const NEW_TODO_CLASS = ".new-todo";
export const TOGGLE_ALL = 'toggle-all';
export const TOGGLE_ALL_CLASS = '.' + TOGGLE_ALL;
export const STORAGE_KEY = 'todos-cyclejs';

export type Sources = {
    DOM: DOMSource,
    storage: any
};
export type Sinks = {
    DOM: Stream<VNode>,
    storage: Stream<{ action: string, key: string, value?: string }>
};

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

export function TodoList(sources: Sources): Sinks {
    const newTodoAdded$ = newTodoAddedIntent(sources);

    const completeAllIntent$ = completeAllIntent(sources);

    const action$ = xs.merge(newTodoAdded$, completeAllIntent$);

    const actionProxy$ = xs.create<Action>();

    const storedTodos$: Stream<TodoListState> = storageIntent(sources);

    const state$ = model(storedTodos$, actionProxy$);

    const compos$: Stream<List<ItemSinks>> = state$
        .map(state => state.todos)
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
                    footer(".footer")
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
        storage: storage$
    };
}

type UpdateCompleteStateFunction = (TodoListState, Todo) => TodoListState;
type Reducer = (TodoListState) => TodoListState;
type CompleteToggleChangePayload = {
    state: CompleteState,
    todo: Todo  
}

function mapToReducers(actions$: Stream<Action>): Stream<Reducer> {
    const addTodoReducer$ = filterActionWithType(actions$, NewTodoAdded).map(action => (state) => state.add(action.value));
    const deleteTodoReducer$ = filterActionWithType(actions$, TodoDeleted).map(action => (state) => state.drop(action.value));
    const completedTodoReducer$ = mapCompleteToggleChanged(actions$, CompleteState.COMPLETED, (state, todo) => state.complete(todo));
    const uncompletedTodoReducer$ = mapCompleteToggleChanged(actions$, CompleteState.UNCOMPLETED, (state, todo) => state.uncomplete(todo));
    const completeAllTodoReducer$ = mapCompleteAllToggleChanged(actions$, CompleteState.COMPLETED, state => state.completeAll());
    const uncompleteAllTodoReducer$ = mapCompleteAllToggleChanged(actions$, CompleteState.UNCOMPLETED, state => state.uncompleteAll());

    return xs.merge(
        addTodoReducer$,
        deleteTodoReducer$,
        completedTodoReducer$,
        uncompletedTodoReducer$,
        completeAllTodoReducer$,
        uncompleteAllTodoReducer$
    );
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
        .map(initState => reducers$.fold((todos, reducer) => reducer(todos), initState))
        .flatten()
        .remember();
}

export default TodoList;