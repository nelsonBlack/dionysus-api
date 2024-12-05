"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const contracts_service_1 = require("./contracts.service");
describe('ContractsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [contracts_service_1.ContractsService],
        }).compile();
        service = module.get(contracts_service_1.ContractsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=contracts.service.spec.js.map