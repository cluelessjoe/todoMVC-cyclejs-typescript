import {mockDOMSource} from "@cycle/dom";
import xs from "xstream";

import {EditEnded, EditStarted, intents} from "../../../../../../main/ts/components/todo/list/item/intent";
import {COMPLETED_TOGGLE_CLASS, DELETED_CLASS, EDIT_CLASS, LABEL} from "../../../../../../main/ts/components/todo/list/item/view";
import {BLUR_EVENT, CHANGE_EVENT, CLICK_EVENT, DOUBLE_CLICK_EVENT} from "../../../../../../main/ts/dom/Events";
import {Todo} from "../../../../../../main/ts/components/todo/list/model";
import {CompleteState, CompleteToggleChanged, TodoDeleted, TodoUpdated} from "../../../../../../main/ts/components/todo/list/intent";
import {ENTER_KEY, ESC_KEY, KEY_UP_EVENT} from "../../../../../../main/ts/dom/Keys";

describe('Todo Item intent tests', () => {

    describe('Delete todo intents', () => {
        it('delete action on button click', (done) => {
            checkTodoDeleted({
                [DELETED_CLASS]: {
                    [CLICK_EVENT]: xs.of({}),
                }
            }, done);
        });

        it('delete action on enter key pressed on empty edit todo input', (done) => {
            checkTodoDeleted({
                [EDIT_CLASS]: {
                    [KEY_UP_EVENT]: xs.of({
                        keyCode: ENTER_KEY,
                        target: {
                            value: ''
                        }
                    }),
                }
            }, done);
        });

        function checkTodoDeleted(mockConfig: {}, done) {
            checkAction(mockConfig, TodoDeleted, done);//FIXME : this doesn't warranty that the todo is really deleted... Could we do black box test, aka testing from the outside and making sure on the outgoing state? Feels more "refactoring proof", which is our aim here :$
        }
    });

    describe("Update todo intents", () => {
        it("update action on enter key pressed on edit todo input with data", (done) => {
            const expectedActionValue = "foobar";
            checkAction({
                    [EDIT_CLASS]: {
                        [KEY_UP_EVENT]: xs.of({
                            keyCode: ENTER_KEY,
                            target: {
                                value: expectedActionValue
                            }
                        })
                    }
                },
                TodoUpdated,
                done,
                action => expect(action.value).toBe(expectedActionValue)
            );
        });
    });

    describe("Complete todo intents", () => {
        it("complete action toggle checked", (done) => {
            checkCompleteTodo(true, done, CompleteState.COMPLETED);
        });

        it("incomplete action toggle unchecked", (done) => {
            checkCompleteTodo(false, done, CompleteState.UNCOMPLETED);
        });

        function checkCompleteTodo(checked: boolean, done, completed: CompleteState) {
            checkAction({
                    [COMPLETED_TOGGLE_CLASS]: {
                        [CHANGE_EVENT]: xs.of({
                            target: {
                                checked: checked
                            }
                        })
                    }
                },
                CompleteToggleChanged,
                done,
                action => expect(action.value).toBe(completed)
            );
        }

    });

    describe("Editing todo intents", () => {
        it("start editing on label double click", (done) => {
            checkAction({
                    [LABEL]: {
                        [DOUBLE_CLICK_EVENT]: xs.of({})
                    }
                },
                EditStarted,
                done);
        });

        it("stop editing on edit input blur", (done) => {
            checkAction({
                    [EDIT_CLASS]: {
                        [BLUR_EVENT]: xs.of({})
                    }
                },
                EditEnded,
                done);
        });

        it("stop editing on edit input esc pressed", (done) => {
            checkAction({
                    [EDIT_CLASS]: {
                        [KEY_UP_EVENT]: xs.of({
                            keyCode: ESC_KEY
                        })
                    }
                },
                EditEnded,
                done);
        });
    });


    const noop: Function = () => {
    };

    function checkAction(mockConfig, expectedAction: string, done: Function, moreAssertion: Function = noop) {
        const todo = new Todo("foo", "1");
        const sources = {
            DOM: mockDOMSource(mockConfig),
            props$: xs.of({todo: todo})
        };

        const action$ = intents(sources);

        action$.addListener({
            next: action => {
                expect(action.type).toBe(expectedAction);
                moreAssertion(action);
                done();
            }
        });
    }
});
