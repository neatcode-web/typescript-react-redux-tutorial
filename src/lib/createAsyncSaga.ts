import { call, put } from 'redux-saga/effects';
import { AsyncActionCreator, PayloadAction } from 'typesafe-actions';

/* 
  For the reusability of utility functions, Make a function accept one value,
  and pass action.payload to parameter.
  If multiple parameters are needed to be passed, make those params to a object.
*/

type PromiseCreatorFunction<P, T> = ((payload: P) => Promise<T>) | (() => Promise<T>);

// Check if action has payload attribute.
function isPayloadAction<P>(action: any): action is PayloadAction<string, P> {
  return action.payload !== undefined;
}

export default function createAsyncSaga<T1, P1, T2, P2, T3, P3>(
  asyncActionCreator: AsyncActionCreator<[T1, P1], [T2, P2], [T3, P3]>,
  promiseCreator: PromiseCreatorFunction<P1, P2>
) {
  return function* saga(action: ReturnType<typeof asyncActionCreator.request>) {
    try {
      const result = isPayloadAction<P1>(action)
        ? yield call(promiseCreator, action.payload)
        : yield call(promiseCreator);
      yield put(asyncActionCreator.success(result));
    } catch (e) {
      yield put(asyncActionCreator.failure(e));
    }
  };
}
