import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { getModelToken } from "@nestjs/sequelize"
import { Contract } from "../models/contract.model"
import { Logger } from "@nestjs/common"
import { Op } from "sequelize"

describe('ContractsService', () => {
  let service: ContractsService;
  let contractModel: typeof Contract;

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
  ]

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: getModelToken(Contract),
          useValue: {
            findAll: jest.fn(),
            findByPk: jest.fn(),
          },
        },
        Logger,
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    contractModel = module.get<typeof Contract>(getModelToken(Contract));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return non-terminated contracts for a profile", async () => {
      const profileId = 1;
      const nonTerminatedContracts = mockContracts.filter(
        (c) => c.status !== "terminated"
      );

      jest
        .spyOn(contractModel, "findAll")
        .mockResolvedValue(nonTerminatedContracts as Contract[]);

      const result = await service.findAll(profileId);

      expect(contractModel.findAll).toHaveBeenCalledWith({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ ClientId: profileId }, { ContractorId: profileId }],
            },
            {
              status: {
                [Op.ne]: "terminated",
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
        .mockResolvedValue(contract as Contract);

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
