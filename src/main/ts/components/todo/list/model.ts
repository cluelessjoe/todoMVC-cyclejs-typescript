import {List} from "immutable";
import xs, {Stream} from "xstream";

import {Action, ClearCompleted, CompleteAllToggleChanged, CompleteState, CompleteToggleChanged, NewTodoAdded, RouteChanged, RouteState, TodoDeleted, TodoUpdated} from "./intent";
import {Route, ROUTE_ACTIVE, ROUTE_ALL, ROUTE_COMPLETED, ROUTE_DEFAULT} from "./index";

export class Todo {
    constructor(readonly text: string, readonly id: string, readonly completed: boolean = false) {
    }
}

export class State {
    readonly allCompleted: boolean;
    readonly activeCount: number;
    readonly completedCount: number;
    private readonly completed: List<Todo>;
    private readonly actives: List<Todo>;
    readonly displayed: List<Todo>;

    constructor(readonly todos: List<Todo>, readonly display: Route = ROUTE_DEFAULT) {
        this.actives = this.todos.filter(t => !t.completed).toList();
        this.completed = this.todos.filter(t => t.completed).toList();
        if (ROUTE_ALL.label === display.label) {
            this.displayed = this.todos;
        } else if (ROUTE_ACTIVE.label === display.label) {
            this.displayed = this.actives;
        } else if (ROUTE_COMPLETED.label === display.label) {
            this.displayed = this.completed;
        } else {
            const message = `display ${display} not expected`;
            console.error(message);
            throw new RangeError(message);
        }
        this.activeCount = this.actives.count();
        this.completedCount = this.completed.count();
        this.allCompleted = this.actives.isEmpty();
    }

    add(value: string, id: string): State {
        return this.newTodoListState(this.todos.insert(0, new Todo(value, id)))
    }

    drop(todo: Todo): State {
        return this.newTodoListState(this.todos.remove(this.getTodoIndex(todo)))
    }

    update(text: string, todo: Todo): State {
        return this.newTodoListState(
            this.todos.set(
                this.getTodoIndex(todo),
                new Todo(text, todo.id, todo.completed)
            ));
    }

    complete(todo: Todo): State {
        return this.toggleTodoState(todo, true);
    }

    uncomplete(todo: Todo): State {
        return this.toggleTodoState(todo, false);
    }

    private toggleTodoState(todo: Todo, state: boolean) {
        return this.newTodoListState(
            this.todos.set(
                this.getTodoIndex(todo),
                new Todo(todo.text, todo.id, state)))
    }

    private getTodoIndex(todo: Todo) {
        return this.todos.indexOf(todo);
    }

    uncompleteAll(): State {
        return this.toggleAllTodoState(false);
    }

    completeAll(): State {
        return this.toggleAllTodoState(true);
    }

    private toggleAllTodoState(state: boolean) {
        const newTodos = this.todos.map(t => new Todo(t.text, t.id, state)).toList();
        return this.newTodoListState(newTodos);
    }

    clearCompleted() {
        return this.newTodoListState(this.todos.filter(t => !t.completed).toList());
    }

    private newTodoListState(todos: List<Todo>): State {
        return new State(todos, this.display);
    }

    displayCompleted() {
        return this.newTodoListStateFromDisplay(ROUTE_COMPLETED);
    }

    private newTodoListStateFromDisplay(display: Route) {
        return new State(this.todos, display);
    }

    displayActive() {
        return this.newTodoListStateFromDisplay(ROUTE_ACTIVE);
    }

    displayAll() {
        return this.newTodoListStateFromDisplay(ROUTE_ALL);
    }

    isDisplayAll(): boolean {
        return this.is(ROUTE_ALL);
    }

    private is(display: Route) {
        return this.display.label === display.label;
    }

    isDisplayActive(): boolean {
        return this.is(ROUTE_ACTIVE);
    }

    isDisplayCompleted(): boolean {
        return this.is(ROUTE_COMPLETED);
    }
}

type UpdateCompleteStateFunction = (TodoListState, Todo) => State;
type Reducer = (TodoListState) => State;
type CompleteToggleChangePayload = {
    state: CompleteState,
    todo: Todo
}

type UpdateTodoPayload = {
    text: string,
    todo: Todo
}

function mapToReducers(idSupplier: () => string, actions$: Stream<Action>): Stream<Reducer> {
    const addTodoReducer$ = filterActionWithType(actions$, NewTodoAdded)
        .map(action => (state) => state.add(action.value, idSupplier()));

    const deleteTodoReducer$ = filterActionWithType(actions$, TodoDeleted)
        .map(action => (state) => state.drop(action.value));

    const updateTodoReducer$ = filterActionWithType(actions$, TodoUpdated)
        .map(action => action.value as UpdateTodoPayload)
        .map(value => (state) => state.update(value.text, value.todo));

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
        updateTodoReducer$,
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

function mapRouteChanged(actions$: Stream<Action>, state: RouteState, reducer: Reducer): Stream<Reducer> {
    return filterActionWithType(actions$, RouteChanged)
        .filter(action => action.value === state)
        .mapTo(reducer);
}

function mapCompleteToggleChanged(actions$: Stream<Action>, state: CompleteState, stateUpdateFn: UpdateCompleteStateFunction): Stream<Reducer> {
    return filterActionWithType(actions$, CompleteToggleChanged)
        .map(action => action.value as CompleteToggleChangePayload)
        .filter(payload => payload.state === state)
        .map(payload => (state) => stateUpdateFn(state, payload.todo));
}

function mapCompleteAllToggleChanged(actions$: Stream<Action>, state: CompleteState, reducer: Reducer): Stream<Reducer> {
    return filterActionWithType(actions$, CompleteAllToggleChanged)
        .filter(action => action.value === state)
        .mapTo(reducer);
}

function filterActionWithType(actions$: Stream<Action>, type: string): Stream<Action> {
    return actions$.filter(action => action.type === type);
}

export function model(state$: Stream<State>, idSupplier: () => string, actions$: Stream<Action>): Stream<State> {
    const reducers$ = mapToReducers(idSupplier, actions$);
    return state$
        .map(initState => reducers$.fold((todos, reducer) => reducer(todos), initState))
        .flatten()
        .remember();
}