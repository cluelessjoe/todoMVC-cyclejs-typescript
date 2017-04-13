import {makeDOMDriver} from "@cycle/dom";
import {run} from "@cycle/run";
import storageDriver from "@cycle/storage";
import {captureClicks, makeHistoryDriver} from "@cycle/history";
import {TodoList} from "./components/todosList/index";

const main = TodoList;
run(main, {
    DOM: makeDOMDriver('.todoapp'),
    storage: storageDriver,
    History: captureClicks(makeHistoryDriver())
});