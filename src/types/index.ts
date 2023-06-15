import { Immutable } from 'immer';

export type PlaygroundStorage = Immutable<{
  expireEarly?: boolean;
}>;
