# typescript-react-redux-tutorial

## Highlights

### Basic

How to declare **Action Type**

```javascript
const INCREASE_BY = 'counter/INCREASE_BY' as const;
```
By using `as const`, can guess the type of action object later.

How to define **Action Creator**

```javascript
export const increaseBy = (diff: number) => ({
  type: INCREASE_BY,
  payload: diff
});
```

Before implement a reducer, add **All action types** to single type alias.

<!-- prettier-ignore -->
```javascript
type CounterAction =
  | ReturnType<typeof increase>
  | ReturnType<typeof decrease>
  | ReturnType<typeof increaseBy>;
```

Then the initial values for reduce state can be like this.

```javascript

// Declare the type of state of redux module.
type CounterState = {
  count: number
};

// Declare the default state
const initialState: CounterState = {
  count: 0
};
```

Define **Reducer** like this.

```javascript
function counter(state: CounterState = initialState, action: CounterAction): CounterState {
  switch (action.type) {
    case INCREASE:
      return { count: state.count + 1 };
    case DECREASE:
      return { count: state.count - 1 };
    case INCREASE_BY:
      return { count: state.count + action.payload };
    default:
      return state;
  }
}
```

And make **Root Reducer** and **Route state** like this.다.

```javascript
import { combineReducers } from 'redux';
import counter from './counter';

const rootReducer = combineReducers({
  counter
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
```

Make **Container** like this.

```javascript
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../modules';
import { increase, decrease, increaseBy } from '../modules/counter';
import Counter from '../components/Counter';

export interface CounterContainerProps {}

const CounterContainer = (props: CounterContainerProps) => {
  // Inquire state.
  const count = useSelector((state: RootState) => state.counter.count);
  const dispatch = useDispatch();
  
  const onIncrease = () => {
    dispatch(increase());
  };

  const onDecrease = () => {
    dispatch(decrease());
  };

  const onIncreaseBy = (diff: number) => {
    dispatch(increaseBy(diff));
  };

  return <Counter count={count} onIncrease={onIncrease} onDecrease={onDecrease} onIncreaseBy={onIncreaseBy} />;
};

export default CounterContainer;
```

### How to use typesafe-actions


```javascript
// Action types
const INCREASE = 'counter/INCREASE';
const DECREASE = 'counter/DECREASE';
const INCREASE_BY = 'counter/INCREASE_BY';

// A function to create a action
export const increase = createStandardAction(INCREASE)();
export const decrease = createStandardAction(DECREASE)();
export const increaseBy = createStandardAction(INCREASE_BY)<number>(); // Set a type of payload as Generics
```


```javascript
const actions = { increase, decrease, increaseBy };
type CounterAction = ActionType<typeof actions>;
```

Make **Reducer** like this.

```javascript
const counter = createReducer<CounterState, CounterAction>(initialState, {
  [INCREASE]: state => ({ count: state.count + 1 }),
  [DECREASE]: state => ({ count: state.count - 1 }),
  [INCREASE_BY]: (state, action) => ({ count: state.count + action.payload })
});
```

If want to use reducer as **Method chaining**, can implement like this

```javascript
const counter = createReducer(initialState)
  .handleAction(increase, state => ({ count: state.count + 1 }))
  .handleAction(decrease, state => ({ count: state.count - 1 }))
  .handleAction(increaseBy, (state, action) => ({
    count: state.count + action.payload
  }));
```

### Split files

When write redux codes using [Ducks pattern](https://github.com/erikras/ducks-modular-redux), if you have too many actions, you can split into actions, reducer, types in different file.

```
modules/
  todos/
    index.ts
    actions.ts
    reducer.ts
    types.ts
```

How to write index.ts

```javascript
export { default } from './reducer';
export * from './actions';
export * from './types';
```

How to use **redux-thunk**

```javascript
import { createAsyncAction } from 'typesafe-actions';
import { GithubProfile } from '../../api/github';
import { AxiosError } from 'axios';

export const GET_USER_PROFILE = 'github/GET_USER_PROFILE';
export const GET_USER_PROFILE_SUCCESS = 'github/GET_USER_PROFILE_SUCCESS';
export const GET_USER_PROFILE_ERROR = 'github/GET_USER_PROFILE_ERROR';

export const getUserProfileAsync = createAsyncAction(
  GET_USER_PROFILE,
  GET_USER_PROFILE_SUCCESS,
  GET_USER_PROFILE_ERROR
)<undefined, GithubProfile, AxiosError>();
```

How to write **Thunk** function

```javascript
import { ThunkAction } from 'redux-thunk';
import { RootState } from '..';
import { GithubAction } from './types';
import { getUserProfile } from '../../api/github';
import { getUserProfileAsync } from './actions';

export function getUserProfileThunk(username: string): ThunkAction<void, RootState, null, GithubAction> {
  return async dispatch => {
    const { request, success, failure } = getUserProfileAsync;
    dispatch(request());
    try {
      const userProfile = await getUserProfile(username);
      dispatch(success(userProfile));
    } catch (e) {
      dispatch(failure(e));
    }
  };
}
```

```javascript
export const getUserProfileThunk = createAsyncThunk(getUserProfileAsync, getUserProfile);
```

```javascript
const github = createReducer<GithubState, GithubAction>(initialState).handleAction(
  transformToArray(getUserProfileAsync),
  createAsyncReducer(getUserProfileAsync, 'userProfile')
);
```

#### How to use redux-saga

```javascript
import { getUserProfileAsync, GET_USER_PROFILE } from './actions';
import { getUserProfile, GithubProfile } from '../../api/github';
import { call, put, takeEvery } from 'redux-saga/effects';

function* getUserProfileSaga(action: ReturnType<typeof getUserProfileAsync.request>) {
  try {
    const userProfile: GithubProfile = yield call(getUserProfile, action.payload);
    yield put(getUserProfileAsync.success(userProfile));
  } catch (e) {
    yield put(getUserProfileAsync.failure(e));
  }
}

export function* githubSaga() {
  yield takeEvery(GET_USER_PROFILE, getUserProfileSaga);
}
```

```javascript
const getUserProfileSaga = createAsyncSaga(getUserProfileAsync, getUserProfile);
```