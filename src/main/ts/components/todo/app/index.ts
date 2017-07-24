import {Sinks} from "@cycle/run";
import {List} from "immutable";
import xs, {Stream} from "xstream";

import {TodoList} from "../list/index";
import {State, Todo} from "../list/model";
import * as uuid from "uuid";
import {Reducer} from "cycle-onionify";
import isolate from "@cycle/isolate";

export const STORAGE_KEY = 'todos-cyclejs';

export function TodoApp(sources): Sinks {
    const childSources = {
        DOM: sources.DOM,
        History: sources.History,
        onion: sources.onion,
        idSupplier: () => uuid.v4()
    };

    const sinks = isolate(TodoList)(childSources);

    return {
        DOM: sinks.DOM,
        History: sinks.History,
        onion: xs.of(readStateFromStorage),
        storage: writeStateIntoStorage(sinks.onion.state$)
    }
}

export function readStateFromStorage(storage): Stream<Reducer<State>> {
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