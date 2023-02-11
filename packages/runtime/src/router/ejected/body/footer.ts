import { RouterHooksConfig } from "../types";

const renderBodyFooter = ({
  notFound,
  params,
  json,
  rewrite,
  redirect,
  response,
  external,
}: RouterHooksConfig) =>
  `
if (!response) {
  if (notFound) {
    ${
      notFound
        ? `
      response = (await notFoundHook(req, res)) || NextResponse.rewrite(new URL("/404", nextRequest.nextUrl));
    `
        : `response = NextResponse.rewrite(new URL("/404", nextRequest.nextUrl));`
    }
    
  } else if (external) {
    ${
      external
        ? `
      response = await externalHook(req, res) || NextResponse.next();
    `
        : `
      response = NextResponse.next();
    `
    }
  } else if (next) {
    let final_pathname = incomingPathname;
    if (typeof next === "function") {
      ${
        params
          ? `
        const final_params = (await paramsHook(params)) || params;
        final_pathname = (next as ((params: ParamType) => string))(final_params);
      `
          : `
        final_pathname = (next as ((params: ParamType) => string))(params);
      `
      }
    } else if (typeof next === "string") {
      final_pathname = next;
    }
    const search = internals.searchParams
      ? internals.searchParams
      : nextRequest.nextUrl.searchParams;
    final_pathname = \`\${final_pathname}?\${search}\`;
    response =
      final_pathname !== \`\${pathname}?\${nextRequest.nextUrl.searchParams}\`
        ? NextResponse.rewrite(new URL(final_pathname, nextRequest.nextUrl))
        : NextResponse.next();
  } else {
    if (!middleware_response) throw new Error("Expected middleware response");
    const middleware_result = middleware_response!;
    if ("redirect" in middleware_result) {
      ${
        redirect
          ? `
        response = (await redirectHook(req, res)) || NextResponse.redirect(
          new URL(middleware_result.redirect, nextRequest.nextUrl),
          middleware_result.status
        );
      `
          : `
        response = NextResponse.redirect(
          new URL(middleware_result.redirect, nextRequest.nextUrl),
          middleware_result.status
        );
      `
      }
    } else if ("rewrite" in middleware_result!) {
      ${
        rewrite
          ? `
        response = (await rewriteHook(req, res)) || NextResponse.rewrite(
          new URL(middleware_result.rewrite, nextRequest.nextUrl)
        );
      `
          : `
        response = NextResponse.rewrite(
          new URL(middleware_result.rewrite, nextRequest.nextUrl)
        );
      `
      }
    } else if ("json" in middleware_result!) {
      ${
        json
          ? `
        response = (await jsonHook(req, res)) 
          || NextResponse.json(middleware_result.json)
      `
          : `
        response = NextResponse.json(middleware_result.json)
      `
      }
    } else throw new Error("invalid middleware response");
  }
}

internals.responseHeaders !== undefined &&
  internals.responseHeaders.forEach((value, key) =>
    response!.headers.append(key, value)
  );

${
  response
    ? `
ev.waitUntil(Promise.resolve(responseHook(response.clone())));
`
    : ""
}

return response;
`.trim();

export default renderBodyFooter;
