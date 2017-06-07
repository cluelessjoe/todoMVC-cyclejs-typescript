import xs, {Stream} from "xstream";
import {Intents} from "./intent";
import {Reducer} from "./index";
import {Todo} from "../model";


export function model(intents: Intents): Stream<Reducer> {
    return xs.merge(
        intents.deleted$
            .mapTo((prev: Todo) => null),
        intents.toggleCompleted$
            .mapTo((prev: Todo) => prev.withCompletedToggled()),
        intents.startEditing$
            .mapTo((prev: Todo) => prev.withEditing(true)),
        intents.stopEditing$
            .map(text => ((prev: Todo) => prev.withText(text))),
        intents.cancelEdit$
            .mapTo((prev: Todo) => prev.withEditing(false)),
    );
}
