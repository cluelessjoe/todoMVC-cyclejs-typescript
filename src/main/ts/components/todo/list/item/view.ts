import {button, div, input, label, li, VNode} from '@cycle/dom';
import {Stream} from 'xstream';

import {Todo} from "../model";

export const DELETED_CLASS = '.destroy';
export const COMPLETED_TOGGLE_CLASS = '.toggle';
export const EDIT_CLASS = '.edit';
export const LABEL = 'label';

export function view(state$: Stream<Todo>): Stream<VNode> {
    return state$
        .map(todo => {
            const editing = todo.editing;
            const text = todo.text;
            const completed = todo.completed;
            const itemClass = getItemClass(editing, completed);

            return li(itemClass, [
                div('.view', [
                    input(COMPLETED_TOGGLE_CLASS, {
                        attrs: {
                            type: 'checkbox',
                            checked: completed
                        }
                    }),
                    label(text),
                    button(DELETED_CLASS)
                ]),
                input(EDIT_CLASS, {
                    attrs: {
                        value: text
                    },
                    hook: {
                        insert: (node) => {
                            if (editing) node.elm.focus();
                        }
                    }

                })
            ]);
        });
}

function getItemClass(editing: boolean, completed: boolean) {
    return completed ? '.completed' :
        editing ? '.editing' :
            ''
}