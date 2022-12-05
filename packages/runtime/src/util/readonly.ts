export function defineReadOnly<T, P extends keyof T>(o: T, p: P, value: T[P]) {
  Object.defineProperty(o, p, {
    configurable: false,
    writable: false,
    value,
  });
}

export function defineReadOnlyPrivate(
  o: unknown,
  p: PropertyKey,
  value: unknown
) {
  Object.defineProperty(o, p, {
    configurable: false,
    writable: false,
    value,
  });
}

export function defineReadOnlyGetter<T, P extends keyof T>(
  o: T,
  p: P,
  getter: () => T[P]
) {
  Object.defineProperty(o, p, {
    configurable: false,
    get: getter,
    set: () => {},
  });
}

export function defineReadOnlyGetterPrivate(
  o: unknown,
  p: PropertyKey,
  getter: () => unknown
) {
  Object.defineProperty(o, p, {
    configurable: false,
    writable: false,
    get: getter,
  });
}
