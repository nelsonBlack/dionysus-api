import { Test, TestingModule } from "@nestjs/testing"
import { JobsService } from "./jobs.service"
import { getModelToken } from "@nestjs/sequelize"
import { Job } from "../models/job.model"
import { Contract } from "../../contracts/models/contract.model"
import { Logger } from "@nestjs/common"
import { Op } from "sequelize"

describe("JobsService", () => {
  let service: JobsService
  let jobModel: typeof Job

  const mockJobs = [
    {
      id: 1,
      description: "Unpaid job for active contract",
      price: 100,
      paid: false,
      paymentDate: null,
      ContractId: 1,
      contract: {
        id: 1,
        status: "in_progress",
        ClientId: 1,
        ContractorId: 2,
      },
    },
    {
      id: 2,
      description: "Paid job for active contract",
      price: 100,
      paid: true,
      paymentDate: new Date(),
      ContractId: 1,
      contract: {
        id: 1,
        status: "in_progress",
        ClientId: 1,
        ContractorId: 2,
      },
    },
  ] as unknown as Job[]

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getModelToken(Job),
          useValue: {
            findAll: jest.fn(),
          },
        },
        Logger,
      ],
    }).compile()

    service = module.get<JobsService>(JobsService)
    jobModel = module.get<typeof Job>(getModelToken(Job))
  })

  describe("findUnpaid", () => {
    it("should return unpaid jobs from active contracts", async () => {
      const profileId = 1
      const unpaidJobs = mockJobs.filter((j) => !j.paid)

      jest.spyOn(jobModel, "findAll").mockResolvedValue(unpaidJobs)

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

      expect(result).toEqual(unpaidJobs)
      expect(result.length).toBe(1)
      expect(result[0].paid).toBe(false)
      expect(result[0].contract.status).toBe("in_progress")
    })

    it("should return empty array when no unpaid jobs found", async () => {
      const profileId = 999

      jest.spyOn(jobModel, "findAll").mockResolvedValue([])

      const result = await service.findUnpaid(profileId)

      expect(jobModel.findAll).toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })
}) 