import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json"
      }
    ]
  },
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/src/**/*.spec.ts"],
      transform: {
        "^.+\\.(t|j)s$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json"
          }
        ]
      },
    },
    {
      displayName: "e2e",
      testMatch: ["<rootDir>/test/e2e/**/*.e2e-spec.ts"],
      transform: {
        "^.+\\.(t|j)s$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json"
          }
        ]
      },
    }
  ],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "./coverage",
  testPathIgnorePatterns: ["/node_modules/"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json"
    }
  }
}

export default config
