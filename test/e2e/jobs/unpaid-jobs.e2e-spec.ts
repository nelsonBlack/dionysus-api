import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { JobsModule } from "../../../src/modules/jobs/jobs.module"
import { SequelizeModule } from "@nestjs/sequelize"
import { Contract } from "../../../src/modules/contracts/models/contract.model"
import { Profile } from "../../../src/modules/profiles/models/profile.model"
import { Job } from "../../../src/modules/jobs/models/job.model"

describe("JobsController (e2e) - Unpaid Jobs", () => {
  let app: INestApplication
  let clientProfile: Profile
  let contractorProfile: Profile
  let activeContract: Contract
  let terminatedContract: Contract

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: "sqlite",
          storage: ":memory:",
          autoLoadModels: true,
          synchronize: true,
          models: [Contract, Profile, Job],
          logging: false,
        }),
        JobsModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    // Setup test data
    await Profile.sync({ force: true })
    await Contract.sync({ force: true })
    await Job.sync({ force: true })

    clientProfile = await Profile.create({
      type: "client",
      firstName: "John",
      lastName: "Doe",
      profession: "Manager",
      balance: 1000,
    })

    contractorProfile = await Profile.create({
      type: "contractor",
      firstName: "Jane",
      lastName: "Smith",
      profession: "Developer",
      balance: 0,
    })

    activeContract = await Contract.create({
      terms: "Active Contract",
      status: "in_progress",
      ClientId: clientProfile.id,
      ContractorId: contractorProfile.id,
    })

    terminatedContract = await Contract.create({
      terms: "Terminated Contract",
      status: "terminated",
      ClientId: clientProfile.id,
      ContractorId: contractorProfile.id,
    })

    // Create jobs
    await Job.create({
      description: "Unpaid job for active contract",
      price: 100,
      paid: false,
      ContractId: activeContract.id,
    })

    await Job.create({
      description: "Paid job for active contract",
      price: 100,
      paid: true,
      paymentDate: new Date(),
      ContractId: activeContract.id,
    })

    await Job.create({
      description: "Unpaid job for terminated contract",
      price: 100,
      paid: false,
      ContractId: terminatedContract.id,
    })
  })

  afterAll(async () => {
    await Job.sync({ force: true })
    await Contract.sync({ force: true })
    await Profile.sync({ force: true })
    await app.close()
  })

  describe("GET /jobs/unpaid", () => {
    it("should return 401 when no profile is provided", () => {
      return request(app.getHttpServer())
        .get("/jobs/unpaid")
        .expect(401)
        .expect({
          message: "Authentication required",
          error: "Unauthorized",
          statusCode: 401,
        })
    })

    it("should return only unpaid jobs from active contracts", async () => {
      const response = await request(app.getHttpServer())
        .get("/jobs/unpaid")
        .set("profile_id", clientProfile.id.toString())
        .expect(200)

      expect(response.body).toEqual({
        status: "success",
        data: expect.arrayContaining([
          expect.objectContaining({
            paid: false,
            Contract: expect.objectContaining({
              status: "in_progress",
            }),
          }),
        ]),
      })

      // Should not include paid jobs or jobs from terminated contracts
      expect(response.body.data).toHaveLength(1)
    })
  })
}) 