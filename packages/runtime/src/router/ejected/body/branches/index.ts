import { Branch, BranchTypes } from "../../types";
import renderCatchAll from "./catch-all";
import renderDynamic from "./dynamic";
import renderDynamicForward from "./dynamic-forward";
import external from "./external";
import renderMiddleware from "./middleware";
import renderNext from "./next";
import notFound from "./not-found";
import renderPathSwitch from "./path-swtich";
import renderRedirect from "./redirect";
import renderRewrite from "./rewrite";
import skip from "./skip";
import renderStaticForward from "./static-forward";

const renderBranch = (branch: Branch): string => {
  switch (branch.type) {
    case BranchTypes.SKIP: {
      return skip;
    }
    case BranchTypes.MIDDLEWARE: {
      return renderMiddleware(branch);
    }
    case BranchTypes.DYNAMIC_FORWARD: {
      return renderDynamicForward(branch);
    }
    case BranchTypes.STATIC_FORWARD: {
      return renderStaticForward(branch);
    }
    case BranchTypes.SWITCH: {
      return renderPathSwitch(branch);
    }
    case BranchTypes.NEXT: {
      return renderNext(branch);
    }
    case BranchTypes.NOT_FOUND: {
      return notFound;
    }
    case BranchTypes.DYNAMIC: {
      return renderDynamic(branch);
    }
    case BranchTypes.CATCH_ALL: {
      return renderCatchAll(branch);
    }
    case BranchTypes.REWRITE: {
      return renderRewrite(branch);
    }
    case BranchTypes.REDIRECT: {
      return renderRedirect(branch);
    }
    case BranchTypes.EXTERNAL: {
      return external;
    }
    default: {
      const exhaustive: never = branch;
      return exhaustive;
    }
  }
};

export default renderBranch;
