import { defineConfig, type DummyRuleMap } from "oxlint";

type RestrictedImportsRule = Extract<DummyRuleMap["no-restricted-imports"], unknown[]>;
type ImportPattern = { group: string[]; message: string } | { regex: string; message: string };

const componentFolders: ImportPattern = {
  group: ["@/components/*/*/*"],
  message: "Import components through their folder index, e.g. @/components/ui/Switch.",
};

/** Patterns every file inside a feature must respect (alias imports). */
const featurePatterns: ImportPattern[] = [
  componentFolders,
  { group: ["@/app", "@/app/**"], message: "Features must not import from app." },
  {
    group: ["@/features", "@/features/**"],
    message:
      "Features must not import other features. Compose them in app/pages, or extract a shared entity.",
  },
];

/** Bans relative imports with `ups` or more leading `../` segments. */
function climbsOutOfFeature(ups: number): ImportPattern {
  return {
    regex: `^(\\.\\./){${ups},}`,
    message: "Relative import leaves this feature; features must not import other features.",
  };
}

function restrict(...patterns: ImportPattern[]): RestrictedImportsRule {
  return ["error", { patterns }];
}

export default defineConfig({
  ignorePatterns: ["dist", "src/app/routeTree.gen.ts"],

  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "error",
  },

  plugins: ["typescript", "react", "unicorn", "jsx-a11y", "oxc", "import"],
  jsPlugins: ["./lint/naming.js"],

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
    "react/self-closing-comp": "error",
    "react/hook-use-state": "error",
    // The automatic JSX runtime (tsconfig "jsx": "react-jsx") needs no React import.
    "react/react-in-jsx-scope": "off",
    // Components import their own stylesheet as a side effect (import "./Switch.css").
    "import/no-unassigned-import": "off",
    // Live regions use role="status" on block elements; <output> only allows phrasing content.
    "jsx-a11y/prefer-tag-over-role": "off",

    // Unicorn & General best practices
    // Naming: modules are camelCase; component files are PascalCase (overrides below).
    "unicorn/filename-case": ["error", { case: "camelCase" }],
    "no-console": ["error", { allow: ["warn", "error"] }],
  },

  overrides: [
    {
      files: ["**/*.spec.tsx", "**/*.spec.ts", "vite.config.ts"],
      rules: {
        "typescript/no-explicit-any": "off",
      },
    },
    // Test code: tick-by-tick loops await on purpose, and mocks/asymmetric matchers
    // (expect.any) need type assertions.
    {
      files: ["**/*.spec.tsx", "**/*.spec.ts", "src/test/**"],
      rules: {
        "no-await-in-loop": "off",
        "typescript/no-unsafe-type-assertion": "off",
      },
    },
    // Component folders: the component and its companions (Switch.tsx, Switch.spec.tsx,
    // Switch.factory.ts) are named after it. index.ts is exempt from filename-case.
    {
      files: [
        "src/components/*/*/**",
        "src/features/*/components/**",
        "src/app/layouts/**",
        "src/app/pages/**",
        "src/app/App.tsx",
        "src/app/App.spec.tsx",
      ],
      rules: { "unicorn/filename-case": ["error", { case: "pascalCase" }] },
    },
    {
      files: ["src/hooks/**", "src/features/*/hooks/**"],
      rules: { "naming/hook-filename": "error" },
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
