import xs, {Stream} from 'xstream';

import {Action} from '../intent';
import {EditEnded, EditStarted} from './intent';

export function model(intents$: Stream<Action>): Stream<boolean> {
    return xs.merge(
        intents$.filter(intent => intent.type === EditEnded).mapTo(false),
        intents$.filter(intent => intent.type === EditStarted).mapTo(true)
    ).startWith(false);
}
