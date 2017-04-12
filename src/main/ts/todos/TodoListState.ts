import {List} from "immutable";
import {Todo} from "./Todo";

export enum Display {ALL, ACTIVE, COMPLETED}

export class TodoListState {
    readonly allCompleted: boolean;
    readonly count: number;
    readonly completedCount: number;
    readonly displayed: List<Todo>;

    constructor(readonly todos: List<Todo>, private readonly display: Display = Display.ALL) {

        if (Display.ALL === display) {
            this.displayed = this.todos;
        } else if (Display.ACTIVE === display) {
            this.displayed = this.todos.filter(t => !t.completed).toList();
        } else if (Display.COMPLETED === display) {
            this.displayed = this.todos.filter(t => t.completed).toList();
        } else {
            const message = `display ${display} not expected`;
            console.error(message);
            throw new RangeError(message);
        }
        this.count = this.displayed.size;
        this.completedCount = this.displayed.filter(t => t.completed).size;
        this.allCompleted = this.displayed.reduce((acc, todo) => acc && todo.completed, true);
    }

    add(value: string): TodoListState {
        return this.newTodoListState(this.todos.insert(0, new Todo(value)))
    }

    drop(todo: Todo): TodoListState {
        return this.newTodoListState(this.todos.remove(this.getTodoIndex(todo)))
    }

    complete(todo: Todo): TodoListState {
        return this.toggleTodoState(todo, true);
    }

    uncomplete(todo: Todo): TodoListState {
        return this.toggleTodoState(todo, false);
    }

    private toggleTodoState(todo: Todo, state: boolean) {
        return this.newTodoListState(
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
        return this.newTodoListState(newTodos);
    }

    clearCompleted() {
        return this.newTodoListState(this.todos.filter(t => !t.completed).toList());
    }

    private newTodoListState(todos: List<Todo>): TodoListState {
        return new TodoListState(todos, this.display);
    }

    displayCompleted() {
        return this.newTodoListStateFromDisplay(Display.COMPLETED);
    }

    private newTodoListStateFromDisplay(filter: Display) {
        return new TodoListState(this.todos, filter);
    }

    displayActive() {
        return this.newTodoListStateFromDisplay(Display.ACTIVE);
    }

    displayAll() {
        return this.newTodoListStateFromDisplay(Display.ALL);
    }

    isDisplayAll(): boolean {
        return this.is(Display.ALL);
    }

    private is(display: Display) {
        return this.display === display;
    }

    isDisplayActive() : boolean {
        return this.is(Display.ACTIVE);
    }

    isDisplayCompleted()  : boolean {
        return this.is(Display.COMPLETED);
    }
}
