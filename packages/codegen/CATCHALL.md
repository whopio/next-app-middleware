## Idea

Assuming the following routes have pages/endpoints

- `/test/:test1/test/`
- `/test/*test1/test/`
- `/test/*test1/test/test/`
- `/test/*test1/test/:test2/`
- `/test/*test1/test/:test2/test/`
- `/test/*test1/test/*test2/`
- `/test/*test1/test/*test2/test/`
- `/test/*test1/test/*test2/test/:test3/`

the resulting matcher should look like this:

```ts
const catchAll: string[][] = [];
let idx = 0;
switch (segments[0]) {
  case "test": {
    switch (segments[1]) {
      default: {
        switch (segments[2]) {
          case "test": {
            switch (segments[3]) {
              case "": {
                // `/test/:test1/test/`
                params.test1 = segments[1];
                break;
              }
              default: {
                notFound = true;
                break;
              }
            }
            break;
          }
          default: {
            const param = [segments[idx + 1]];
            catchAll.push(param);
            let idx = idx + 2;
            let matched = false;
            while (!matched && idx < segments.length) {
              switch (segments[idx]) {
                case "test": {
                  switch (segments[idx + 1]) {
                    case "": {
                      // /test/*test1/test/
                      params.test1 = catchAll[0];
                      matched = true;
                      break;
                    }
                    case "test": {
                      switch (segments[idx + 2]) {
                        case "": {
                          // /test/*test1/test/test/
                          params.test1 = catchAll[0];
                          matched = true;
                          break;
                        }
                      }
                      break;
                    }
                    default: {
                      switch (segments[idx + 2]) {
                        case "": {
                          // /test/*test1/test/:test2/
                          params.test1 = catchAll[0];
                          params.test2 = segments[idx + 2];
                          matched = true;
                          break;
                        }
                        case "test": {
                          switch (segments[idx + 3]) {
                            case "": {
                              // /test/*test1/test/:test2/test/
                              params.test1 = catchAll[0];
                              params.test2 = segments[idx + 2];
                              matched = true;
                              break;
                            }
                          }
                          break;
                        }
                        default: {
                          const param = [segments[idx + 1]];
                          catchAll.push(param);
                          let idx = idx + 2;
                          let matched = false;
                          while (!matched && idx < segments.length) {
                            switch (segments[idx]) {
                              case "": {
                                // /test/*test1/test/*test2/
                                params.test1 = catchAll[0];
                                params.test2 = catchAll[1];
                                matched = true;
                                break;
                              }
                              case "test": {
                                switch (segments[idx + 1]) {
                                  case "": {
                                    // /test/*test1/test/*test2/test/
                                    params.test1 = catchAll[0];
                                    params.test2 = catchAll[1];
                                    matched = true;
                                    break;
                                  }
                                  default: {
                                    switch (segments[idx + 2]) {
                                      case "": {
                                        // /test/*test1/test/*test2/test/:test3/
                                        params.test1 = catchAll[0];
                                        params.test2 = catchAll[1];
                                        params.test3 = segments[idx + 1];
                                        matched = true;
                                        break;
                                      }
                                    }
                                    break;
                                  }
                                }
                                break;
                              }
                            }
                            param.push(segments[idx]);
                            idx++;
                          }
                          notFound = !matched;
                          break;
                        }
                      }
                    }
                  }
                  break;
                }
              }
              param.push(segments[idx]);
              idx++;
            }
            notFound = !matched;
            break;
          }
        }
        break;
      }
    }
    break;
  }
  default: {
    notFound = true;
    break;
  }
}
```

turns out this cant happen! its not valid for the catch all to not be the last part of the URL which also makes it impossible for multiple catch all segments to exist.

updated:

Assuming the following routes have pages/endpoints

- `/:test1/test/`
- `/*test1/`
- `/test/test/test1*/`
- `/:test1/test/test2*/`

resulting matcher:

```ts
switch (segments[0]) {
  case "test": {
    switch (segments[1]) {
      case "test": {
        // /test/test/test1*/
        const [,,...catchAll] = segments;
        params.test1 = catchAll;
        break;
      }
      default: {
        notFound = true;
        break;
      }
    }
    break;
  }
  case "": {
    notFound = true;
    break;
  }
  default {
    // this is the behaviour for a segment that can either be a single
    // dynamic segment or a catch all:
    // first try to match as if the catch-all didnt exist
    switch (segments[1]) {
      case "test": {
        switch (segments[2]) {
          case "": {
            // /:test1/test/
            params.test1 = segments[0];
          }
          default {
            // /:test1/test/test2*/
            // this is the rendered output when there is a c
            // atch-all with no dynamic segment at the same level
            params.test1 = segments[0];
            const [, , ...catchAll] = segments;
            params.test2 = catchAll;
          }
        }
      }
      default: {
        notFound = true;
        break;
      }
    }
    // if the matcher above does not match anything the catch-all
    // got hit
    if (notFound) {
      // /*test1/
      notFound = false;
      const [...catchAll] = segments;
      params.test1 = catchAll;
      break;
    }
    break;
  }
}
```
