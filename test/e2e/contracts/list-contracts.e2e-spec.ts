import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import supertest from "supertest"
import { ContractsModule } from "../../../src/modules/contracts/contracts.module"
import { SequelizeModule } from "@nestjs/sequelize"
import { Contract } from "../../../src/modules/contracts/models/contract.model"
import { Profile } from "../../../src/modules/profiles/models/profile.model"
import { Job } from "../../../src/modules/jobs/models/job.model"

describe("ContractsController (e2e) - List Contracts", () => {
  let app: INestApplication
  let clientProfile: Profile
  let contractorProfile: Profile

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
        ContractsModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    // Setup test data
    await Profile.sync({ force: true })
    await Contract.sync({ force: true })

    clientProfile = await Profile.create({
      id: 1,
      type: "client",
      firstName: "John",
      lastName: "Doe",
      profession: "Manager",
      balance: 1000,
    })

    contractorProfile = await Profile.create({
      id: 2,
      type: "contractor",
      firstName: "Jane",
      lastName: "Smith",
      profession: "Developer",
      balance: 0,
    })

    // Create contracts with different statuses
    await Contract.create({
      terms: "Active Contract",
      status: "in_progress",
      ClientId: clientProfile.id,
      ContractorId: contractorProfile.id,
    })

    await Contract.create({
      terms: "Terminated Contract",
      status: "terminated",
      ClientId: clientProfile.id,
      ContractorId: contractorProfile.id,
    })

    await Contract.create({
      terms: "New Contract",
      status: "new",
      ClientId: clientProfile.id,
      ContractorId: contractorProfile.id,
    })
  })

  afterAll(async () => {
    await Contract.sync({ force: true })
    await Profile.sync({ force: true })
    await app.close()
  })

  describe("GET /contracts", () => {
    it("should return 401 when no profile is provided", () => {
      return supertest(app.getHttpServer())
        .get("/contracts")
        .expect(401)
        .expect({
          statusCode: 401,
          message: "Profile ID is required",
          error: "Unauthorized",
        })
    })

    it("should return only non-terminated contracts for client", async () => {
      const response = await supertest(app.getHttpServer())
        .get("/contracts")
        .set("profile_id", clientProfile.id.toString())
        .expect(200)

      expect(response.body).toEqual({
        status: "success",
        data: expect.arrayContaining([
          expect.objectContaining({
            status: "in_progress",
          }),
          expect.objectContaining({
            status: "new",
          }),
        ]),
      })

      // Should not include terminated contracts
      expect(response.body.data).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            status: "terminated",
          }),
        ])
      )
    })

    it("should return only contracts belonging to the profile", async () => {
      const otherProfile = await Profile.create({
        type: "client",
        firstName: "Other",
        lastName: "Client",
        profession: "Manager",
        balance: 1000,
      })

      const response = await supertest(app.getHttpServer())
        .get("/contracts")
        .set("profile_id", otherProfile.id.toString())
        .expect(200)

      expect(response.body).toEqual({
        status: "success",
        data: [], // Should be empty as this profile has no contracts
      })
    })
  })
})
