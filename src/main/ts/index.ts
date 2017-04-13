import {makeDOMDriver} from "@cycle/dom";
import {captureClicks, makeHistoryDriver} from "@cycle/history";
import storageDriver from "@cycle/storage";
import {run} from "@cycle/run";

import {TodoApp} from "./components/todo/app/index";

const main = TodoApp;

run(main, {
    DOM: makeDOMDriver('.todoapp'),
    storage: storageDriver,
    History: captureClicks(makeHistoryDriver())
});

