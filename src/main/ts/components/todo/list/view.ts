import {a, button, div, footer, h1, header, input, label, li, section, span, strong, ul} from "@cycle/dom";
import xs, {Stream} from "xstream";
import {VNode} from "snabbdom/vnode";

import {State} from "./model";
import {CLEAR_COMPLETED_CLASS, NEW_TODO_CLASS, Route, ROUTE_ACTIVE, ROUTE_ALL, ROUTE_COMPLETED, TOGGLE_ALL_SELECTOR} from "./index";


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
                            addFilter(ROUTE_ALL, state.isDisplayAll()),
                            addFilter(ROUTE_ACTIVE, state.isDisplayActive()),
                            addFilter(ROUTE_COMPLETED, state.isDisplayCompleted()),
                        ]),
                        button(CLEAR_COMPLETED_CLASS, `Clear completed (${state.completedCount})`)
                    ])
                ]
            );
        });
}

function addFilter(route: Route, isSelected: boolean): VNode {
    return li(a({
        props: {
            href: route.hash
        },
        class: {
            selected: isSelected
        }
    }, route.label));
};