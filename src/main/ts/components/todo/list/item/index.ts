import {Stream} from 'xstream';
import {DOMSource, VNode} from '@cycle/dom';
import {StateSource} from "cycle-onionify";

import {intent} from './intent';
import {model} from './model';
import {view} from './view';
import {Todo} from "../model";

export type Reducer = (prev: Todo) => Todo | undefined ;

export type Sources = {
    DOM: DOMSource,
    onion: StateSource<Todo>
};
export type Sinks = {
    DOM: Stream<VNode>,
    onion: Stream<Reducer>;
};

function TodoListItem(sources: Sources): Sinks {
    const intents = intent(sources);
    const reducer$ = model(intents);
    const vdom$ = view(sources.onion.state$);

    return {
        DOM: vdom$,
        onion: reducer$
    };
}

export default TodoListItem;
