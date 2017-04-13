import {makeDOMDriver} from "@cycle/dom";
import {captureClicks, makeHistoryDriver} from "@cycle/history";
import storageDriver from "@cycle/storage";
import {run, Sinks} from "@cycle/run";
import {List} from "immutable";
import {Stream} from "xstream";

import {TodoList} from "./components/todosList/index";
import {State, Todo} from "./components/todosList/model";

const STORAGE_KEY = 'todos-cyclejs';

run(main, {
    DOM: makeDOMDriver('.todoapp'),
    storage: storageDriver,
    History: captureClicks(makeHistoryDriver())
});

function main(sources): Sinks {
    const sinks = TodoList({
        DOM: sources.DOM,
        History: sources.History,
        initialState$: readStateFromStorage(sources.storage)
    });

    return {
        DOM: sinks.DOM,
        History: sinks.History,
        storage: writeStateIntoStorage(sinks.state$)
    }
}

function readStateFromStorage(storage): Stream<State> {
    return storage.local
        .getItem(STORAGE_KEY)
        .map(storeEntry => JSON.parse(storeEntry) || {})
        .map(storedJsonTodos => new State(List<Todo>(storedJsonTodos.todos)))
        .take(1)
        .startWith(new State(List<Todo>()));
}

function writeStateIntoStorage(state$): Stream<string> {
    return state$
        .map(t => JSON.stringify({
            todos: t.todos.toArray()
        }))
        .map(jsonTodos => {
            return {
                action: 'setItem',
                key: STORAGE_KEY,
                value: jsonTodos//FIXME : persist display
            };
        });
}