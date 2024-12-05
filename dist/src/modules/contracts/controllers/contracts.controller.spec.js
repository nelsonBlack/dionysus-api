"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const contracts_controller_1 = require("./contracts.controller");
describe('ContractsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [contracts_controller_1.ContractsController],
        }).compile();
        controller = module.get(contracts_controller_1.ContractsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=contracts.controller.spec.js.map