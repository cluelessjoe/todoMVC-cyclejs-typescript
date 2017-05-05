import {div, li, mockDOMSource, ul, VNode} from "@cycle/dom";
import xs from "xstream";
import {List, Range} from "immutable";

import {NEW_TODO_CLASS, Sinks, TodoList} from "../../../../../main/ts/components/todo/list/index";
import {State, Todo} from "../../../../../main/ts/components/todo/list/model";
import {ENTER_KEY, KEY_DOWN_EVENT} from "../../../../../main/ts/dom/Keys";
import * as fs from "fs";
import * as path from "path";
import * as uuid from "uuid";
import mock = jest.mock;

describe('Todo list', () => {
    const createTodo: () => Todo = () => createTodoWithUuid(uuid.v4());
    const createTodoWithUuid: (uuid: string) => Todo = uuid => new Todo("foo", uuid, false);
    const createState: (l: List<Todo>) => State = todos => new State(todos);

    it('net test', done => {
        const todoNb = 3;
        const newValue = "foo";

        const mockConfig = {
            [NEW_TODO_CLASS]: {
                [KEY_DOWN_EVENT]: xs.of({
                    keyCode: ENTER_KEY,
                    target: {
                        value: newValue
                    }
                }),
            }
        };

        const sources = {
            DOM: mockDOMSource(mockConfig),
            History: xs.empty(),
            initialState$: xs.of(createState(
                Range(0, todoNb)
                    .map(i => createTodoWithUuid(i.toString()))
                    .toList())
            ),
            idSupplier: () => "12"
        };

        const sinks: Sinks = TodoList(sources);

        sinks.DOM.addListener({
            next: vdom => {
                const stringify = JSON.stringify(vdom, null, 4);
                const filename = path.resolve(__dirname, "snapshot");
                if (fs.existsSync(filename)) {
                    const read = fs.readFileSync(filename).toString();
                    expect(read).toEqual(stringify);
                } else {
                    fs.writeFileSync(filename, stringify);
                }
                done();
            }
        });
    });

    it('displays a list of todos', done => {
        const todoNb = 3;
        const sources = {
            DOM: mockDOMSource({}),
            History: xs.empty(),
            initialState$: xs.of(createState(Range(0, todoNb).map(i => createTodo()).toList()))
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
