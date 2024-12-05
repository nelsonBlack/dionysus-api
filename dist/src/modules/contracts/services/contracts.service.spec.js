"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const contracts_service_1 = require("./contracts.service");
const sequelize_1 = require("@nestjs/sequelize");
const contract_model_1 = require("../models/contract.model");
const common_1 = require("@nestjs/common");
const sequelize_2 = require("sequelize");
describe('ContractsService', () => {
    let service;
    let contractModel;
    const mockContracts = [
        {
            id: 1,
            terms: "Active Contract",
            status: "in_progress",
            ClientId: 1,
            ContractorId: 2,
        },
        {
            id: 2,
            terms: "Terminated Contract",
            status: "terminated",
            ClientId: 1,
            ContractorId: 2,
        },
        {
            id: 3,
            terms: "New Contract",
            status: "new",
            ClientId: 1,
            ContractorId: 2,
        },
    ];
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                contracts_service_1.ContractsService,
                {
                    provide: (0, sequelize_1.getModelToken)(contract_model_1.Contract),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                    },
                },
                common_1.Logger,
            ],
        }).compile();
        service = module.get(contracts_service_1.ContractsService);
        contractModel = module.get((0, sequelize_1.getModelToken)(contract_model_1.Contract));
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe("findAll", () => {
        it("should return non-terminated contracts for a profile", async () => {
            const profileId = 1;
            const nonTerminatedContracts = mockContracts.filter((c) => c.status !== "terminated");
            jest
                .spyOn(contractModel, "findAll")
                .mockResolvedValue(nonTerminatedContracts);
            const result = await service.findAll(profileId);
            expect(contractModel.findAll).toHaveBeenCalledWith({
                where: {
                    [sequelize_2.Op.and]: [
                        {
                            [sequelize_2.Op.or]: [{ ClientId: profileId }, { ContractorId: profileId }],
                        },
                        {
                            status: {
                                [sequelize_2.Op.ne]: "terminated",
                            },
                        },
                    ],
                },
            });
            expect(result).toEqual(nonTerminatedContracts);
            expect(result.length).toBe(2);
            expect(result.every((c) => c.status !== "terminated")).toBe(true);
        });
        it("should return empty array when profile has no contracts", async () => {
            const profileId = 999;
            jest.spyOn(contractModel, "findAll").mockResolvedValue([]);
            const result = await service.findAll(profileId);
            expect(contractModel.findAll).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });
    describe("findById", () => {
        it("should return a contract by id", async () => {
            const contractId = 1;
            const contract = mockContracts[0];
            jest
                .spyOn(contractModel, "findByPk")
                .mockResolvedValue(contract);
            const result = await service.findById(contractId);
            expect(contractModel.findByPk).toHaveBeenCalledWith(contractId);
            expect(result).toEqual(contract);
        });
        it("should return null when contract not found", async () => {
            const contractId = 999;
            jest.spyOn(contractModel, "findByPk").mockResolvedValue(null);
            const result = await service.findById(contractId);
            expect(contractModel.findByPk).toHaveBeenCalledWith(contractId);
            expect(result).toBeNull();
        });
    });
});
//# sourceMappingURL=contracts.service.spec.js.map