import isolate from "@cycle/isolate";
import {List} from "immutable";
import {GenericInput, HistoryInput} from "@cycle/history";
import {DOMSource} from "@cycle/dom";
import xs, {Stream} from "xstream";
import {VNode} from "snabbdom/vnode";

import TodoListItem, {Sinks as ItemSinks} from "./todoListItem/index";
import {ENTER_KEY, KEY_DOWN_EVENT, KEY_UP_EVENT} from "../../dom/Keys";
import {model, Todo, TodoListState} from "./model";
import {view} from "./view";
import {intent} from "./intent";
import {Intent} from "../../utils/Action";

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

export const COMPLETED_PATH = "/completed";
export const ACTIVE_PATH = "/active";

export const storageIntent: (Sources) => Stream<TodoListState> = (sources: Sources) => {
    return sources.storage.local
        .getItem(STORAGE_KEY)
        .map(storeEntry => JSON.parse(storeEntry) || {})
        .map(storedJsonTodos => new TodoListState(List<Todo>(storedJsonTodos.todos)))
        .take(1)
        .startWith(new TodoListState(List<Todo>()));
};

export function TodoList(sources: Sources): Sinks {
    const intentProxy$ = xs.create<Intent>();

    const intent$ = intent(sources);

    const storedTodos$: Stream<TodoListState> = storageIntent(sources);

    const state$ = model(storedTodos$, intentProxy$);

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

    const allActions$ = xs.merge(intent$, actionsFromSinks);

    intentProxy$.imitate(allActions$);

    const todoItemSinks$: Stream<VNode[]> = compos$
        .map(todoItemsSinks => xs.combine(...todoItemsSinks.map(sink => sink.DOM).toArray()))
        .flatten();

    let vdom$: Stream<VNode> = view(state$, todoItemSinks$);

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

export default TodoList;