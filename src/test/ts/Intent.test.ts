import xs, {Stream} from "xstream";
import {readStateFromStorage, STORAGE_KEY} from "../../main/ts/components/todo/app/index";
import {NEW_TODO_CLASS} from "../../main/ts/components/todo/list/index";
import {ENTER_KEY, KEY_DOWN_EVENT} from "../../main/ts/dom/Keys";
import {mockDOMSource, MockConfig} from "@cycle/dom";
import {newTodoAddedIntent} from "../../main/ts/components/todo/list/intent";


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

            const newTodo$ = newTodoAddedIntent(sources);

            newTodo$
                .addListener({
                    next: event => {
                        expect(event.value).toBe(expected);
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

    });

    let mockStorage = function (storageContentProvider: (key: string) => Stream<string>) {
        return {
            local: {
                getItem: storageContentProvider
            }

        };

    };
    describe('Local storage', () => {
        it('use key ' + STORAGE_KEY, done => {
            const storage = mockStorage(key => {
                expect(key).toBe(STORAGE_KEY);
                done();
                return xs.empty();
            });
            readStateFromStorage(storage);
        });

        it('start with no todos', done => {
            const sources = mockStorage(key => xs.empty());

            const storage$ = readStateFromStorage(sources);

            storage$.addListener({
                next: state => {
                    expect(state.todos.isEmpty()).toBeTruthy();
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