import { defineConfig } from "oxlint";

const componentFolders = {
  group: ["@/components/*/*/*"],
  message: "Import components through their folder index, e.g. @/components/ui/switch.",
};

/** Patterns every file inside a feature must respect (alias imports). */
const featurePatterns = [
  componentFolders,
  { group: ["@/app", "@/app/**"], message: "Features must not import from app." },
  {
    group: ["@/features", "@/features/**"],
    message:
      "Features must not import other features. Compose them in app/pages, or extract a shared entity.",
  },
];

/** Bans relative imports with `ups` or more leading `../` segments. */
function climbsOutOfFeature(ups) {
  return {
    regex: `^(\\.\\./){${ups},}`,
    message: "Relative import leaves this feature; features must not import other features.",
  };
}

function restrict(...patterns) {
  return ["error", { patterns }];
}

export default defineConfig({
  ignorePatterns: ["dist", "src/app/route-tree.gen.ts"],

  categories: {
    correctness: "error",
    suspicious: "error",
    pedantic: "error",
    style: "error",
    perf: "error",
    restriction: "error",
  },

  plugins: ["typescript", "react", "unicorn", "jsx-a11y", "oxc", "import"],

  options: {
    typeAware: true,
    typeCheck: true,
    denyWarnings: true,
  },

  rules: {
    // TypeScript strictness additions
    "typescript/no-explicit-any": "error",
    "typescript/no-floating-promises": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-member-access": "error",

    // React strictness additions
    "react/jsx-no-leaked-render": ["error", { validTypes: ["string", "boolean"] }],
    "react/self-closing-comp": "error",
    "react/hook-use-state": "error",

    // Unicorn & General best practices
    "unicorn/filename-case": ["error", { case: "kebabCase" }],
    "no-console": ["error", { allow: ["warn", "error"] }],
  },

  overrides: [
    {
      files: ["**/*.spec.tsx", "**/*.spec.ts", "vite.config.ts"],
      rules: {
        "typescript/no-explicit-any": "off",
      },
    },
    // Architecture boundaries: app (routes, pages) -> features -> shared.
    // Features never import each other. Later overrides replace earlier ones for the same
    // files (rule options are not merged), so each one repeats its full pattern list.
    {
      files: ["src/features/**"],
      rules: { "no-restricted-imports": restrict(...featurePatterns) },
    },
    // Relative imports bypass the alias patterns above, so ban the ones that climb out of
    // the feature folder, per file depth (own files are never more than this deep).
    {
      files: ["src/features/*/components/*/*"],
      rules: {
        "no-restricted-imports": restrict(...featurePatterns, climbsOutOfFeature(3)),
      },
    },
    {
      files: ["src/features/*/hooks/*", "src/features/*/api/*", "src/features/*/store/*"],
      rules: {
        "no-restricted-imports": restrict(...featurePatterns, climbsOutOfFeature(2)),
      },
    },
    {
      files: ["src/features/*/*"],
      rules: {
        "no-restricted-imports": restrict(...featurePatterns, climbsOutOfFeature(1)),
      },
    },
    {
      files: ["src/components/**", "src/hooks/**", "src/lib/**", "src/config/**", "src/types/**"],
      rules: {
        "no-restricted-imports": restrict(componentFolders, {
          // Matches aliases and relative paths alike: reaching app/features means passing
          // through a segment named after them.
          regex: "(^|/)(app|features)(/|$)",
          message: "Shared code must not import from app or features.",
        }),
      },
    },
    {
      files: [
        "src/app/routes/**",
        "src/app/pages/**",
        "src/app/layouts/**",
        "src/app/*.ts",
        "src/app/*.tsx",
        "src/main.tsx",
      ],
      rules: {
        "no-restricted-imports": restrict(componentFolders, {
          regex: "(^|/)features/[^/]+/[^/]+",
          message: "Routes, layouts and pages import features through their index.ts only.",
        }),
      },
    },
  ],
});
