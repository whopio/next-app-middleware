import { Branch, BranchTypes } from "../../types";
import renderCatchAll from "./catch-all";
import renderDynamic from "./dynamic";
import renderForward from "./forward";
import renderMiddleware from "./middleware";
import renderNext from "./next";
import notFound from "./not-found";
import renderPathSwitch from "./path-swtich";
import renderRedirect from "./redirect";
import renderRewrite from "./rewrite";

const renderBranch = (branch: Branch): string => {
  switch (branch.type) {
    case BranchTypes.MIDDLEWARE: {
      return renderMiddleware(branch);
    }
    case BranchTypes.FORWARD: {
      return renderForward(branch);
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
    default: {
      const exhaustive: never = branch;
      return exhaustive;
    }
  }
};

export default renderBranch;
