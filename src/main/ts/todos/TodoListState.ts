import {List} from "immutable";
import {Todo} from "./Todo";

export class TodoListState {
    readonly allCompleted: boolean;

    constructor(readonly todos: List<Todo>) {
        this.allCompleted = this.todos.reduce((acc, todo) => acc && todo.completed, true);
    }

    add(value: string): TodoListState {
        return new TodoListState(this.todos.push(new Todo(value)))
    }

    drop(todo: Todo): TodoListState {
        return new TodoListState(this.todos.remove(this.getTodoIndex(todo)))
    }

    complete(todo: Todo): TodoListState {
        return this.toggleTodoState(todo, true);
    }

    uncomplete(todo: Todo): TodoListState {
        return this.toggleTodoState(todo, false);
    }

    private toggleTodoState(todo: Todo, state: boolean) {
        return new TodoListState(
            this.todos.set(
                this.getTodoIndex(todo),
                new Todo(todo.text, state)))
    }

    private getTodoIndex(todo: Todo) {
        return this.todos.indexOf(todo);
    }

    uncompleteAll(): TodoListState {
        return this.toggleAllTodoState(false);
    }

    completeAll(): TodoListState {
        return this.toggleAllTodoState(true);
    }

    private toggleAllTodoState(state: boolean) {
        const newTodos = this.todos.map(t => new Todo(t.text, state)).toList();
        return new TodoListState(newTodos);
    }
}
