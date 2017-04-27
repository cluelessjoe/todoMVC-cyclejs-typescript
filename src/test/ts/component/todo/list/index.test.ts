import {div, li, mockDOMSource, ul, VNode} from "@cycle/dom";
import xs from "xstream";
import {List, Range} from "immutable";

import {Sinks, TodoList} from "../../../../../main/ts/components/todo/list/index";
import {State, Todo} from "../../../../../main/ts/components/todo/list/model";

describe('Todo list', () => {
    const createTodo: () => Todo = () => new Todo("foo");
    const createState: (l: List<Todo>) => State = todos => new State(todos);

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
                const mainSection = vdom.children[1];
                const ul = mainSection.children[2];
                expect(ul.children.length).toBe(todoNb);
                done();
            }
        })
    });

    function walkTree(vnode: VNode, sel: string): VNode[] {
        const children: VNode[] = vnode.children
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
