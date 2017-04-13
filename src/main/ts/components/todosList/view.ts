import {a, button, div, footer, h1, header, input, label, li, section, span, strong, ul} from "@cycle/dom";
import xs, {Stream} from "xstream";
import {VNode} from "snabbdom/vnode";

import {State} from "./model";
import {ACTIVE_PATH, CLEAR_COMPLETED_CLASS, COMPLETED_PATH, NEW_TODO_CLASS, TOGGLE_ALL, TOGGLE_ALL_CLASS, TOGGLE_ALL_SELECTOR} from "./index";



function itemPluralize(count) {
    return count !== 1 ? 's' : ''
}
export function view(state$: Stream<State>, todoItemSinks$: Stream<VNode[]>) {
    return xs.combine(state$, todoItemSinks$)
        .map(itemVdomAndTodos => {
            const state: State = itemVdomAndTodos[0];
            const itemsVdom = itemVdomAndTodos[1];


            return div([
                    header(".header", [
                        h1('todos'),
                        input(NEW_TODO_CLASS, {
                            props: {
                                type: 'text',
                                placeholder: 'What needs to be done?',
                                autofocus: true,
                                name: 'newTodo'
                            },
                            hook: {
                                update: (oldVNode, {elm}) => {
                                    elm.value = '';
                                },
                            },
                        })]
                    ),
                    section(".main", [
                        input(TOGGLE_ALL_SELECTOR, {
                            attrs: {
                                type: 'checkbox',
                                checked: state.allCompleted
                            },
                            hook: {
                                update: (oldVNode, {elm}) => {
                                    elm.checked = state.allCompleted;
                                },
                            }
                        }),
                        label({
                            attrs: {
                                for: 'toggle-all'
                            }
                        }),
                        ul(".todo-list", itemsVdom)]
                    ),
                    footer(".footer", [
                        span(".todo-count", [
                            strong(state.activeCount),
                            ` item${itemPluralize(state.activeCount)} left`]),
                        ul('.filters', [
                            addFilter("/", "All", state.isDisplayAll()),
                            addFilter(ACTIVE_PATH, "Active", state.isDisplayActive()),
                            addFilter(COMPLETED_PATH, "Completed", state.isDisplayCompleted()),
                        ]),
                        button(CLEAR_COMPLETED_CLASS, `Clear completed (${state.completedCount})`)
                    ])
                ]
            );
        });
};

function addFilter(href: string, label: string, isSelected: boolean): VNode {
    //FIXME : consolidate
    if (isSelected) {
        return li(a({
            props: {
                href: href
            },
            class: {
                selected: true
            }
        }, label));
    } else {
        return li(a({
            props: {
                href: href
            }
        }, label));
    }
};