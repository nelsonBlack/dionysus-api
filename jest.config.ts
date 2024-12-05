import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
  moduleFileExtensions: ["ts", "js", "json"],
  rootDir: ".",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testRegex: "(spec|e2e-spec)\\.ts$",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/**/*.ts", "!**/node_modules/**"],
  coverageDirectory: "./coverage",
}

export default config
