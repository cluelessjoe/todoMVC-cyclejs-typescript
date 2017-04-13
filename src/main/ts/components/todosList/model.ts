import {List} from "immutable";
import xs, {Stream} from "xstream";

import {Intent} from "../../utils/Action";
import {ClearCompleted, CompleteAllToggleChanged, CompleteState, CompleteToggleChanged, NewTodoAdded, RouteChanged, RouteState, TodoDeleted} from "./intent";
export enum Display {ALL, ACTIVE, COMPLETED}

export class Todo {
    constructor(readonly text: string, readonly completed: boolean = false) {
    }
}

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

    isDisplayActive(): boolean {
        return this.is(Display.ACTIVE);
    }

    isDisplayCompleted(): boolean {
        return this.is(Display.COMPLETED);
    }
}

type UpdateCompleteStateFunction = (TodoListState, Todo) => TodoListState;
type Reducer = (TodoListState) => TodoListState;
type CompleteToggleChangePayload = {
    state: CompleteState,
    todo: Todo
}

function mapToReducers(actions$: Stream<Intent>): Stream<Reducer> {
    const addTodoReducer$ = filterActionWithType(actions$, NewTodoAdded)
        .map(action => (state) => state.add(action.value));
    const deleteTodoReducer$ = filterActionWithType(actions$, TodoDeleted)
        .map(action => (state) => state.drop(action.value));
    const completedTodoReducer$ = mapCompleteToggleChanged(actions$, CompleteState.COMPLETED, (state, todo) => state.complete(todo));
    const uncompletedTodoReducer$ = mapCompleteToggleChanged(actions$, CompleteState.UNCOMPLETED, (state, todo) => state.uncomplete(todo));
    const completeAllTodoReducer$ = mapCompleteAllToggleChanged(actions$, CompleteState.COMPLETED, state => state.completeAll());
    const uncompleteAllTodoReducer$ = mapCompleteAllToggleChanged(actions$, CompleteState.UNCOMPLETED, state => state.uncompleteAll());
    const clearCompletedReducer$ = filterActionWithType(actions$, ClearCompleted)
        .map(action => (state) => state.clearCompleted());
    const activeRouteReducers$ = mapRouteChanged(actions$, RouteState.ACTIVE, state => state.displayActive());
    const completeRouteReducers$ = mapRouteChanged(actions$, RouteState.COMPLETED, state => state.displayCompleted());
    const allRouteReducers$ = mapRouteChanged(actions$, RouteState.ALL, state => state.displayAll());

    return xs.merge(
        addTodoReducer$,
        deleteTodoReducer$,
        completedTodoReducer$,
        uncompletedTodoReducer$,
        completeAllTodoReducer$,
        uncompleteAllTodoReducer$,
        clearCompletedReducer$,
        activeRouteReducers$,
        completeRouteReducers$,
        allRouteReducers$
    );
}

function mapRouteChanged(actions$: Stream<Intent>, state: RouteState, reducer: Reducer): Stream<Reducer> {
    return filterActionWithType(actions$, RouteChanged)
        .filter(action => action.value === state)
        .mapTo(reducer);
}

function mapCompleteToggleChanged(actions$: Stream<Intent>, state: CompleteState, stateUpdateFn: UpdateCompleteStateFunction): Stream<Reducer> {
    return filterActionWithType(actions$, CompleteToggleChanged)
        .map(action => action.value as CompleteToggleChangePayload)
        .filter(payload => payload.state === state)
        .map(payload => (state) => stateUpdateFn(state, payload.todo));
}

function mapCompleteAllToggleChanged(actions$: Stream<Intent>, state: CompleteState, reducer: Reducer): Stream<Reducer> {
    return filterActionWithType(actions$, CompleteAllToggleChanged)
        .filter(action => action.value === state)
        .mapTo(reducer);
}

function filterActionWithType(actions$: Stream<Intent>, type: string): Stream<Intent> {
    return actions$.filter(action => action.type === type);
}

export function model(state$: Stream<TodoListState>, actions$: Stream<Intent>): Stream<TodoListState> {
    const reducers$ = mapToReducers(actions$);
    return state$
        .map(initState => reducers$
            .debug("reducers")
            .fold((todos, reducer) => reducer(todos), initState))
        .flatten()
        .remember()
        ;
}