import chai = require('chai');
import {MockConfig, mockDOMSource} from "@cycle/dom";
import xs, {Stream} from "xstream";
import {newTodoInputIntents} from "../../main/ts/components/todo/list/intent";
import {NEW_TODO_CLASS} from "../../main/ts/components/todo/list/index";
import {ENTER_KEY, KEY_DOWN_EVENT} from "../../main/ts/dom/Keys";
import {readStateFromStorage, STORAGE_KEY} from "../../main/ts/components/todo/app/index";

const assert = chai.assert;

describe('Intent tests', () => {
    describe('New todo intents', () => {
        it('create the todo on pressing enter key', (done) => {
            const expected = "abc";

            const mockConfig = {
                [NEW_TODO_CLASS]: {
                    [KEY_DOWN_EVENT]: xs.of({
                        keyCode: ENTER_KEY,
                        target: {
                            value: expected
                        }
                    }),
                }
            };

            const sources = {
                DOM: mockDOMSource(mockConfig),
                History: null,
                initialState$: null
            };

            const newTodo$ = newTodoInputIntents(sources);

            newTodo$
                .addListener({
                    next: event => {
                        assert.equal(event.value, expected);
                        assert.isOk(event); //FIXME
                        done();
                    }
                });
        });

        it('create multiple todos on multiple key press', (done) => {
            const expected = "abc";

            const mockConfig = {} as MockConfig;
            mockConfig[NEW_TODO_CLASS] = {
                [KEY_DOWN_EVENT]: xs.of({
                    keyCode: ENTER_KEY,
                    target: {
                        value: expected
                    }
                }, {
                    keyCode: ENTER_KEY,
                    target: {
                        value: expected
                    }
                }),
            };

            const sources = {
                DOM: mockDOMSource(mockConfig),
                History: null,
                initialState$: null
            };

            const newTodo$ = newTodoInputIntents(sources);

            let called = 0;
            newTodo$
                .addListener({
                    next: event => {
                        called++;
                        if (called === 2) {
                            done();
                        }
                    }
                });
        });

    });

    let mockStorage = function (storageContentProvider: (key: string) => Stream<string>) {
        return {
            storage: {
                local: {
                    getItem: storageContentProvider
                }
            }
        };
    };
    describe('Local storage', () => {
        it('use key ' + STORAGE_KEY, done => {
            const sources = mockStorage(key => {
                assert.equal(key, STORAGE_KEY);
                done();
                return xs.empty();
            });

            readStateFromStorage(sources);
        });

        it('start with no todos', done => {
            const sources = mockStorage(key => xs.empty());

            const storage$ = readStateFromStorage(sources);

            storage$.addListener({
                next: state => {
                    assert.isOk(state.todos.isEmpty());
                    done();
                }
            });
        });

        /* FIXME : implement
         it('read todos from storage', done => {
         const storedText = "foo";
         const expectedTodoText = "footext";

         const storedState = {
         newTodoText: storedText,
         todos: [{
         text: expectedTodoText
         }]
         };

         //FIXME check if there is a hook in stringify
         const sources = mockStorage(key => xs.of(JSON.stringify(storedState)));

         const storage$ = readStateFromStorage(sources);

         storage$.addListener({
         next: state => {
         assert.equal(1, state.todos.size);
         assert.isOk(state.newTodoText === undefined);
         done();
         }
         });
         });

         it('save todos to storage', done => {

         });
         */
    });
})
;