import {makeDOMDriver} from '@cycle/dom';
import TodoList from './todos/TodoList';
import {run} from "@cycle/run";
import storageDriver from '@cycle/storage';

const main = TodoList;

run(main, {
    DOM: makeDOMDriver('.todoapp'),
    storage: storageDriver
});