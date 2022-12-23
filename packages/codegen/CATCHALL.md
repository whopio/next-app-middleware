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
          }
          default: {
            const param = [segments[1], segments[2]];
            catchAll.push(param);
            let idx = 3;
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
                        default: {
                          notFound = true;
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
                            default: {
                              notFound = true;
                              break;
                            }
                          }
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
                          notFound = true;
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
            notFound = true;
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
