import {a, button, div, footer, h1, header, input, label, li, section, span, strong, ul} from "@cycle/dom";
import xs, {Stream} from "xstream";
import {VNode} from "snabbdom/vnode";

import {State} from "./model";
import {CLEAR_COMPLETED_CLASS, NEW_TODO_CLASS, Route, ROUTE_ACTIVE, ROUTE_ALL, ROUTE_COMPLETED, TOGGLE_ALL_SELECTOR} from "./index";

export function view(state$: Stream<State>, cancelled$: Stream<boolean>, todoItemSinks$: Stream<VNode[]>) {
    return xs.combine(state$, cancelled$, todoItemSinks$)
        .map(itemVdomAndTodos => {
            const state: State = itemVdomAndTodos[0];
            const cancelled = itemVdomAndTodos[1];
            const itemsVdom = itemVdomAndTodos[2];

            return div(renderContent(state, cancelled, itemsVdom));
        });
}

function renderContent(state: State, cancelled: boolean, itemsVdom: VNode[]) {
    const hasTodos = !state.todos.isEmpty();
    const header = renderHeader(cancelled);
    return hasTodos ?
        [header, renderMain(state, itemsVdom), renderFooter(state)] :
        [header]
}

function renderMain(state: State, itemsVdom: VNode[]) {
    return section(".main", [
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
    );
}

function renderHeader(cancelled: boolean) {
    return header(".header", [
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
                    console.log("update", cancelled, elm);
                    elm.value = '';
                    if(cancelled) {
                        elm.blur();
                    }
                },
            },
        })]
    );
}

function renderFooter(state: State) {
    return footer(".footer", [
        span(".todo-count", [
            strong(state.activeCount),
            ` item${itemPluralize(state.activeCount)} left`]),
        ul('.filters', [
            renderFilter(ROUTE_ALL, state.isDisplayAll()),
            renderFilter(ROUTE_ACTIVE, state.isDisplayActive()),
            renderFilter(ROUTE_COMPLETED, state.isDisplayCompleted()),
        ]),
        button(CLEAR_COMPLETED_CLASS, `Clear completed (${state.completedCount})`)
    ]);
}

function itemPluralize(count) {
    return count !== 1 ? 's' : ''
}

function renderFilter(route: Route, isSelected: boolean): VNode {
    return li(a({
        props: {
            href: route.hash
        },
        class: {
            selected: isSelected
        }
    }, route.label));
}
