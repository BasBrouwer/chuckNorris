// Local oxlint plugin for naming rules `unicorn/filename-case` cannot express.

const HOOK_NAME = /^use[A-Z][A-Za-z0-9]*$/;

/**
 * The part of oxlint's rule context this plugin uses (oxlint does not export the type).
 * @typedef {{ filename: string; report(descriptor: { node: unknown; message: string }): void }} RuleContext
 */

/** Every file in a hooks folder is named after its hook: useThing.ts, useThing.spec.ts. */
const hookFilename = {
  meta: {
    type: "suggestion",
    docs: { description: "Require hook files to be named useThing" },
    schema: [],
  },
  /** @param {RuleContext} context */
  create(context) {
    return {
      /** @param {unknown} node */
      Program(node) {
        const basename = context.filename.split(/[\\/]/).at(-1) ?? "";
        const [stem = ""] = basename.split(".");
        if (stem === "index" || HOOK_NAME.test(stem)) {
          return;
        }
        context.report({
          node,
          message: `Hook files are named after their hook (useThing.ts); rename "${basename}".`,
        });
      },
    };
  },
};

export default {
  meta: { name: "naming" },
  rules: { "hook-filename": hookFilename },
};
