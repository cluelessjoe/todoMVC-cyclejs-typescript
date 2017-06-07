import xs, {Stream} from "xstream";
import {ENTER_KEY, ESC_KEY, KEY_UP_EVENT} from "../../../../dom/Keys";
import {BLUR_EVENT, CHANGE_EVENT, CLICK_EVENT, DOUBLE_CLICK_EVENT} from "../../../../dom/Events";
import {Sources} from "./index";
import {COMPLETED_TOGGLE_CLASS, DELETED_CLASS, EDIT_CLASS, LABEL} from "./view";

export const EditStarted = 'EditStarted';
export const EditEnded = 'EditEnded';

export class Intents {
    constructor(readonly deleted$:Stream<any>,
                readonly toggleCompleted$:Stream<boolean>,
                readonly startEditing$:Stream<any>,
                readonly stopEditing$:Stream<string>,
                readonly cancelEdit$:Stream<any>) {
    }
}
export function intent(sources: Sources): Intents {
    const domSource = sources.DOM;

    const editEnterEvent$ = domSource
        .select(EDIT_CLASS)
        .events(KEY_UP_EVENT)
        .map(ev => ev as KeyboardEvent)
        .filter(ev => ev.keyCode === ENTER_KEY);

    const editBlurEvent$ = domSource.select(EDIT_CLASS).events(BLUR_EVENT);

    return {
        deleted$: domSource
            .select(DELETED_CLASS).events(CLICK_EVENT)
            .mapTo(null),
        toggleCompleted$: domSource
            .select(COMPLETED_TOGGLE_CLASS)
            .events(CHANGE_EVENT)
            .map(ev => (ev as any).target.checked),
        startEditing$: domSource
            .select(LABEL).events(DOUBLE_CLICK_EVENT)
            .mapTo(null),
        stopEditing$: xs.merge(editEnterEvent$, editBlurEvent$)
            .map(ev => (ev.target as HTMLInputElement).value),
        cancelEdit$: domSource
            .select(EDIT_CLASS)
            .events(KEY_UP_EVENT)
            .map(ev => ev as KeyboardEvent)
            .filter(ev => ev.keyCode === ESC_KEY)
            .mapTo(null)
    };
}
