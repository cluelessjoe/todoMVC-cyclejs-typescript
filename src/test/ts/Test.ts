import chai = require('chai');
import {newTodoAddedIntent, NEW_TODO_CLASS, ENTER_KEY, storageIntent, STORAGE_KEY, newTodoTextChangedIntent, KEY_DOWN_EVENT, KEY_UP_EVENT} from '../../main/ts/todos/TodoList';
import {MockConfig, mockDOMSource, s} from "@cycle/dom";
import xs, {Stream} from 'xstream';
import {NewTodoAdded} from "../../main/ts/todos/TodoAction";

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
                storage : null
            };

            const newTodo$ = newTodoAddedIntent(sources);

            newTodo$
                .addListener({
                    next: event => {
                        assert.equal(event.value, expected);
                        assert.isOk(event instanceof NewTodoAdded);
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
                storage : null
            };

            const newTodo$ = newTodoAddedIntent(sources);

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

        it('new todo input saved on keyup', (done) => {
            const expected = "abc";

            const mockConfig = {} as MockConfig;
            mockConfig[NEW_TODO_CLASS] = {
                [KEY_UP_EVENT]: xs.of({
                    target: {
                        value: expected
                    }
                }, {
                    target: {
                        value: expected
                    }
                }),
            };

            const sources = {
                DOM: mockDOMSource(mockConfig),
                storage : null
            };

            const newTodo$ = newTodoTextChangedIntent(sources);

            let called = 0;
            newTodo$
                .addListener({
                    next: event => {
                        assert.equal(event.value, expected);
                        called++;
                        if (called == 2) {
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

            storageIntent(sources);
        });

        it('start with no todos', done => {
            const sources = mockStorage(key => xs.empty());

            const storage$ = storageIntent(sources);

            storage$.addListener({
                next: state => {
                    assert.isOk(state.todos.isEmpty());
                    assert.isOk(state.newTodoText === undefined);
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

         const storage$ = storageIntent(sources);

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