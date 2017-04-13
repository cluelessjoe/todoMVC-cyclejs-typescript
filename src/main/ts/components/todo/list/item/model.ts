import xs, {Stream} from "xstream";

import {Intent} from "../intent";
import {EditEnded, EditStarted} from "./intent";

export function model(intents$: Stream<Intent>): Stream<boolean> {
    return xs.merge(
        intents$.filter(intent => intent.type === EditEnded).mapTo(false),
        intents$.filter(intent => intent.type === EditStarted).mapTo(true)
    ).startWith(false);
}
