import {Sinks} from "@cycle/run";
import {List} from "immutable";
import {Stream} from "xstream";

import {TodoList} from "../list/index";
import {State, Todo} from "../list/model";
import * as uuid from "uuid";

export const STORAGE_KEY = 'todos-cyclejs';

export function TodoApp(sources): Sinks {
    const sinks = TodoList({
        DOM: sources.DOM,
        History: sources.History,
        initialState$: readStateFromStorage(sources.storage),
        idSupplier: () => uuid.v4()
    });

    return {
        DOM: sinks.DOM,
        History: sinks.History,
        storage: writeStateIntoStorage(sinks.state$)
    }
}

export function readStateFromStorage(storage): Stream<State> {
    return storage
        .local
        .getItem(STORAGE_KEY)
        .map(storeEntry => JSON.parse(storeEntry) || {})
        .map(storedJsonTodos => new State(List<Todo>(storedJsonTodos.todos), storedJsonTodos.display))
        .take(1)
        .startWith(new State(List<Todo>()));
}

function writeStateIntoStorage(state$): Stream<string> {
    return state$
        .map(t => JSON.stringify({
            todos: t.todos.toArray(),
            display: t.display
        }))
        .map(jsonTodos => {
            return {
                action: 'setItem',
                key: STORAGE_KEY,
                value: jsonTodos
            };
        });
}