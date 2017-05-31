import {div, li, mockDOMSource, ul, VNode} from "@cycle/dom";
import xs from "xstream";
import {List, Range} from "immutable";

import {NEW_TODO_CLASS, Sinks, TodoList} from "../../../../../main/ts/components/todo/list/index";
import {State, Todo} from "../../../../../main/ts/components/todo/list/model";
import {ENTER_KEY, KEY_DOWN_EVENT, KEY_UP_EVENT} from "../../../../../main/ts/dom/Keys";
import * as fs from "fs";
import * as path from "path";
import * as uuid from "uuid";
import {EDIT_CLASS} from "../../../../../main/ts/components/todo/list/item/view";
import mock = jest.mock;

describe('Todo list', () => {
    const createTodo: () => Todo = () => createTodoWithUuid(uuid.v4());
    const createTodoWithUuid: (uuid: string) => Todo = uuid => new Todo("randomText" + uuid, uuid, false);
    const createState: (l: List<Todo>) => State = todos => new State(todos);

    function writeToFile(overVdom: any) {
        const currentJsonDom = JSON.stringify(overVdom, null, 2);
        const filename = path.resolve(__dirname, "snapshot.json");
        if (fs.existsSync(filename)) {
            const savedJsonDom = fs.readFileSync(filename).toString();
            expect(currentJsonDom).toEqual(savedJsonDom);
        } else {
            fs.writeFileSync(filename, currentJsonDom);
        }
    }

    it('net test', done => {
        const todoNb = 1;
        const newValue = "newTodoText";


        const edit$ = xs.create();
        const newTodo$ = xs.create();

        const mockConfig = {
            '.___0': {
                [EDIT_CLASS]: {
                    [KEY_UP_EVENT]: edit$,
                }
            },
            [NEW_TODO_CLASS]: {
                [KEY_DOWN_EVENT]: newTodo$,
            },
        };

        const sources = {
            DOM: mockDOMSource(mockConfig),
            History: xs.empty(),
            initialState$: xs.of(createState(
                Range(0, todoNb)
                    .map(i => createTodoWithUuid(i.toString()))
                    .toList())
            ),
            idSupplier: () => todoNb.toString()
        };

        const sinks: Sinks = TodoList(sources);

        var overVdom = null;
        sinks.DOM.take(5).addListener({
            next: vdom => {
                //console.log("next !!");
                //writeToFile(vdom);
                overVdom = vdom;
            },
            complete: () => {
                console.log("complete");
                writeToFile(overVdom);
                done();
            },
            error: a => {
                console.log("Error", a);
            }
        });

       edit$.shamefullySendNext({
            keyCode: ENTER_KEY,
            target: {
                value: "valuePostEdit"
            }
        });

        newTodo$.shamefullySendNext({
            keyCode: ENTER_KEY,
            target: {
                value: newValue
            }
        });
    });

    it('displays a list of todos', done => {
        const todoNb = 3;
        const sources = {
            DOM: mockDOMSource({}),
            History: xs.empty(),
            initialState$: xs.of(createState(Range(0, todoNb).map(i => createTodo()).toList())),
            idSupplier: () => "1"
        };

        const sinks: Sinks = TodoList(sources);

        sinks.DOM.addListener({
            next: vdom => {
                const lis = walkTree(vdom, "li");
                expect(lis.length).toBe(todoNb);
                done();
            }
        })
    });

    function walkTree(vnode: VNode, sel: string): VNode[] {
        const vnodeChildren = vnode.children;
        if (!vnodeChildren) return [];

        const children: VNode[] = vnodeChildren
            .filter(vnode => typeof vnode !== 'string')
            .map(vnode => vnode as VNode);

        const find: VNode[] = children.filter(vnode => vnode.sel === sel);
        if (find.length === 0) {
            return flatten(children.map(child => walkTree(child, sel)));
        } else {
            return find;
        }
    }

    const flatten = arr => arr.reduce(
        (acc, val) => acc.concat(
            Array.isArray(val) ? flatten(val) : val
        ), []);


    describe('walktree', () => {
        it('should work', () => {
            const vNode = div(ul([li(), li(), li()]));
            const res = walkTree(vNode, "li");
            expect(res.length).toBe(3);
        });
    });

});
