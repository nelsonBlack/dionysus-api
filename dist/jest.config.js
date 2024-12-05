"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
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
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map