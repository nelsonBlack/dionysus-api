import { Test, TestingModule } from "@nestjs/testing"
import { JobsService } from "./jobs.service"
import { getModelToken } from "@nestjs/sequelize"
import { Job } from "../models/job.model"
import { Profile } from "../../profiles/models/profile.model"
import { Contract } from "../../contracts/models/contract.model"
import { Logger } from "@nestjs/common"
import { Sequelize, Op } from "sequelize"
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common"

describe("JobsService", () => {
  let service: JobsService
  let sequelize: Sequelize
  let jobModel: typeof Job
  let profileModel: typeof Profile

  const mockTransaction = { 
    commit: jest.fn(),
    rollback: jest.fn(),
    LOCK: { UPDATE: 'UPDATE', SHARE: 'SHARE' }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getModelToken(Job),
          useValue: {
            findAll: jest.fn(),
            findByPk: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getModelToken(Profile),
          useValue: {
            findByPk: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn().mockImplementation(() => mockTransaction),
          },
        },
        Logger,
      ],
    }).compile()

    service = module.get<JobsService>(JobsService)
    sequelize = module.get<Sequelize>(Sequelize)
    jobModel = module.get<typeof Job>(getModelToken(Job))
    profileModel = module.get<typeof Profile>(getModelToken(Profile))
  })

  describe("findUnpaid", () => {
    it("should return unpaid jobs from active contracts", async () => {
      const profileId = 1
      const mockUnpaidJobs = [{
        id: 1,
        paid: false,
        contract: {
          status: "in_progress",
        },
      }]

      jest.spyOn(jobModel, "findAll").mockResolvedValue(mockUnpaidJobs as any)

      const result = await service.findUnpaid(profileId)

      expect(jobModel.findAll).toHaveBeenCalledWith({
        where: {
          paid: false,
        },
        include: [
          {
            model: Contract,
            where: {
              status: "in_progress",
              [Op.or]: [
                { ClientId: profileId },
                { ContractorId: profileId },
              ],
            },
          },
        ],
      })

      expect(result).toEqual(mockUnpaidJobs)
    })
  })

  describe("payJob", () => {
    const mockJob = {
      id: 1,
      price: 100,
      paid: false,
      ContractId: 1,
      contract: {
        ClientId: 1,
        ContractorId: 2,
      },
    }

    const mockClient = {
      id: 1,
      balance: 1000,
      type: "client",
    }

    const mockContractor = {
      id: 2,
      balance: 0,
    }

    it("should use transaction and lock for payment process", async () => {
      jest.spyOn(jobModel, "findByPk").mockResolvedValue(mockJob as any)
      jest.spyOn(profileModel, "findByPk")
        .mockResolvedValueOnce(mockClient as any)
        .mockResolvedValueOnce(mockContractor as any)

      await service.payJob(1, mockClient.id)

      expect(sequelize.transaction).toHaveBeenCalled()
      expect(jobModel.findByPk).toHaveBeenCalledWith(1, {
        include: [Contract],
        lock: true,
        transaction: mockTransaction,
      })
    })

    it("should throw if job is not found", async () => {
      jest.spyOn(jobModel, "findByPk").mockResolvedValue(null)

      await expect(service.payJob(999, 1)).rejects.toThrow(NotFoundException)
    })

    it("should throw if job is already paid", async () => {
      jest.spyOn(jobModel, "findByPk").mockResolvedValue({
        ...mockJob,
        paid: true,
      } as any)

      await expect(service.payJob(1, 1)).rejects.toThrow(BadRequestException)
    })

    it("should throw if client has insufficient balance", async () => {
      jest.spyOn(jobModel, "findByPk").mockResolvedValue({
        ...mockJob,
        price: 2000,
      } as any)
      jest.spyOn(profileModel, "findByPk").mockResolvedValue({
        ...mockClient,
        balance: 100,
      } as any)

      await expect(service.payJob(1, 1)).rejects.toThrow(BadRequestException)
    })

    it("should throw if non-client tries to pay", async () => {
      jest.spyOn(jobModel, "findByPk").mockResolvedValue(mockJob as any)
      jest.spyOn(profileModel, "findByPk").mockResolvedValue({
        ...mockClient,
        type: "contractor",
      } as any)

      await expect(service.payJob(1, 1)).rejects.toThrow(ForbiddenException)
    })

    it("should successfully process payment", async () => {
      jest.spyOn(jobModel, "findByPk").mockResolvedValue(mockJob as any)
      jest.spyOn(profileModel, "findByPk")
        .mockResolvedValueOnce(mockClient as any)
        .mockResolvedValueOnce(mockContractor as any)

      const updateJobSpy = jest.spyOn(jobModel, "update")
      const updateProfileSpy = jest.spyOn(profileModel, "update")

      await service.payJob(1, mockClient.id)

      // Verify job update
      expect(updateJobSpy).toHaveBeenCalledWith(
        {
          paid: true,
          paymentDate: expect.any(Date),
        },
        {
          where: { id: mockJob.id },
          transaction: mockTransaction,
        }
      )

      // Verify balance updates
      expect(updateProfileSpy).toHaveBeenCalledWith(
        { balance: mockClient.balance - mockJob.price },
        {
          where: { id: mockClient.id },
          transaction: mockTransaction,
        }
      )

      expect(updateProfileSpy).toHaveBeenCalledWith(
        { balance: mockContractor.balance + mockJob.price },
        {
          where: { id: mockContractor.id },
          transaction: mockTransaction,
        }
      )
    })

    it("should rollback transaction on error", async () => {
      jest.spyOn(jobModel, "findByPk").mockResolvedValue(mockJob as any)
      jest.spyOn(profileModel, "findByPk")
        .mockResolvedValueOnce(mockClient as any)
        .mockResolvedValueOnce(mockContractor as any)
      jest.spyOn(jobModel, "update").mockRejectedValue(new Error("Update failed"))

      await expect(service.payJob(1, mockClient.id)).rejects.toThrow()
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })
  })
}) 