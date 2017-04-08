import {List} from "immutable";
import {Todo} from "./Todo";

export class TodoListState {
    constructor(
        readonly todos: List<Todo>,
        readonly newTodoText?: string
    ) {}

    add(value: string): TodoListState {
        return new TodoListState(this.todos.push(new Todo(value)), "")
    }

    updateNewTodoText(value: string): TodoListState {
        return new TodoListState(this.todos, value)
    }
}
