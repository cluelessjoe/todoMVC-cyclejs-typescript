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

    drop(todo: Todo): TodoListState {
        return new TodoListState(this.todos.remove(this.getTodoIndex(todo)), this.newTodoText)
    }

    complete(todo:Todo): TodoListState {
        return this.toggleTodoState(todo, true);
    }

    uncomplete(todo:Todo): TodoListState {
        return this.toggleTodoState(todo, false);
    }

    private toggleTodoState(todo: Todo, state: boolean) {
        return new TodoListState(
            this.todos.set(
                this.getTodoIndex(todo),
                new Todo(todo.text, state)),
            this.newTodoText)
    }

    private getTodoIndex(todo: Todo) {
        return this.todos.indexOf(todo);
    }
}
