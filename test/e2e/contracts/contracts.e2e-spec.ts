import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import supertest from "supertest"
import { ContractsModule } from "../../../src/modules/contracts/contracts.module"
import { SequelizeModule } from "@nestjs/sequelize"
import { Contract } from "../../../src/modules/contracts/models/contract.model"
import { Profile } from "../../../src/modules/profiles/models/profile.model"
import { Job } from "../../../src/modules/jobs/models/job.model"
import { createTestProfile, getAuthHeader } from "../../helpers/auth.helper"

describe("ContractsController (e2e)", () => {
  let app: INestApplication
  let contract: Contract
  let clientProfile: Profile
  let contractorProfile: Profile
  let testClient: Profile

  jest.setTimeout(30000)

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
    await Job.sync({ force: true })

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

    contract = await Contract.create({
      id: 1,
      terms: "Test contract",
      status: "new",
      ClientId: clientProfile.id,
      ContractorId: contractorProfile.id,
    })

    testClient = await createTestProfile("client")
  })

  afterAll(async () => {
    await Contract.sync({ force: true })
    await Profile.sync({ force: true })
    await Job.sync({ force: true })
    await app.close()
  })

  describe("GET /contracts/:id", () => {
    it("should require authentication", () => {
      return supertest(app.getHttpServer())
        .get("/contracts/1")
        .expect(401)
        .expect({
          statusCode: 401,
          message: "Profile ID is required",
          error: "Unauthorized",
        })
    })

    it("should return 404 when contract is not found", () => {
      return supertest(app.getHttpServer())
        .get("/contracts/999")
        .set(getAuthHeader(clientProfile.id))
        .expect(404)
        .expect({
          message: "Contract with ID 999 not found",
          error: "Not Found",
          statusCode: 404,
        })
    })

    it("should return contract when client requests their contract", async () => {
      const response = await supertest(app.getHttpServer())
        .get(`/contracts/${contract.id}`)
        .set(getAuthHeader(clientProfile.id))
        .expect(200)

      expect(response.body).toEqual({
        status: "success",
        data: expect.objectContaining({
          id: contract.id,
          terms: contract.terms,
          status: contract.status,
          ClientId: clientProfile.id,
          ContractorId: contractorProfile.id,
        }),
      })
    })
  })

  describe("GET /contracts", () => {
    it("should require authentication", () => {
      return supertest(app.getHttpServer())
        .get("/contracts")
        .expect(401)
        .expect({
          statusCode: 401,
          message: "Profile ID is required",
          error: "Unauthorized",
        })
    })

    it("should get contracts", () => {
      return supertest(app.getHttpServer())
        .get("/contracts")
        .set(getAuthHeader(clientProfile.id))
        .expect(200)
    })
  })
})
