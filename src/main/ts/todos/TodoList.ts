import xs, {Stream} from "xstream";
import {button, div, DOMSource, h1, header, input, label, li, s, section, ul, VNode} from "@cycle/dom";
import {NewTodoAdded, NewTodoTextChanged, TodoDeleted, TodosCompleted, TodosUncompleted} from "./TodoAction";
import {TodoListState} from "./TodoListState";
import {Todo} from "./Todo";
import {List, Seq} from "immutable";
import TodoListItem, {Sinks as ItemSinks} from "./TodoListItem";
import isolate from "@cycle/isolate";
import {Action} from "../Action";

export const ENTER_KEY = 13;

export const NEW_TODO_CLASS = ".new-todo";
export const KEY_DOWN_EVENT = 'keydown';
export const KEY_UP_EVENT = 'keyup';
const ESC_KEY = 27;

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

export function newTodoTextChangedIntent(sources: Sources): Stream<Action> {
    return sources.DOM.select(NEW_TODO_CLASS)
        .events(KEY_UP_EVENT)
        .map(ev => ev as any)
        .map(ev => String(ev.target.value).trim())
        .map(v => new Action(NewTodoTextChanged, v));
}

export function TodoList(sources: Sources): Sinks {
    const newTodoTextChanged$ = newTodoTextChangedIntent(sources);

    const newTodoAdded$ = newTodoAddedIntent(sources);

    const action$ = xs.merge(newTodoAdded$, newTodoTextChanged$);

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
            const state = itemVdomAndTodos[0];
            const itemsVdom = itemVdomAndTodos[1];
            return div([
                    header(".header", [
                        h1('todos'),
                        input(NEW_TODO_CLASS, {
                            attrs: {
                                type: "text",
                                placeholder: "What needs to be done?",
                                value: state.newTodoText
                            },
                            hook: {
                                update: (oldVNode, {elm}) => {
                                    elm.value = state.newTodoText;
                                },
                            },
                        })]
                    ),
                    section(".main",
                        ul(".todo-list", itemsVdom)
                    )
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
        })
    ;

    return {
        DOM: vdom$,
        storage: storage$
    };
}

function model(state$: Stream<TodoListState>, actions$: Stream<Action>): Stream<TodoListState> {
    return state$
        .map(initState =>
            actions$.fold((todos, action) => {
                if (action.type === NewTodoAdded) {
                    return todos.add(action.value as string);
                } else if (action.type === NewTodoTextChanged) {
                    return todos.updateNewTodoText(action.value as string);
                } else if (action.type === TodoDeleted) {
                    return todos.drop(action.value as Todo);
                } else if (action.type === TodosCompleted) {
                    return todos.complete(action.value as Todo);
                } else if (action.type === TodosUncompleted) {
                    return todos.uncomplete(action.value as Todo);
                } else {
                    throw new RangeError(`Action ${action.type} is not supported`);
                }
            }, initState)
        )
        .flatten()
        .remember();
}

export default TodoList;