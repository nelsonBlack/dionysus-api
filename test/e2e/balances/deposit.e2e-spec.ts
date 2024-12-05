import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import supertest from "supertest"
import { SequelizeModule } from "@nestjs/sequelize"
import { Contract } from "../../../src/modules/contracts/models/contract.model"
import { Profile } from "../../../src/modules/profiles/models/profile.model"
import { Job } from "../../../src/modules/jobs/models/job.model"
import { BalancesModule } from "../../../src/modules/balances/balances.module"

describe("BalancesController (e2e) - Deposit", () => {
  let app: INestApplication
  let clientProfile: Profile
  let contractorProfile: Profile
  let contract: Contract
  let unpaidJobs: Job[]

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
        BalancesModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  beforeEach(async () => {
    // Clear database
    await Job.destroy({ where: {}, force: true })
    await Contract.destroy({ where: {}, force: true })
    await Profile.destroy({ where: {}, force: true })

    // Create test data
    clientProfile = await Profile.create({
      firstName: "John",
      lastName: "Doe",
      profession: "Client",
      balance: 100,
      type: "client",
    })

    contractorProfile = await Profile.create({
      firstName: "Jane",
      lastName: "Smith",
      profession: "Developer",
      balance: 0,
      type: "contractor",
    })

    contract = await Contract.create({
      terms: "Test Contract",
      status: "in_progress",
      ClientId: clientProfile.id,
      ContractorId: contractorProfile.id,
    })

    // Create unpaid jobs
    unpaidJobs = await Promise.all([
      Job.create({
        description: "Job 1",
        price: 100,
        paid: false,
        ContractId: contract.id,
      }),
      Job.create({
        description: "Job 2",
        price: 200,
        paid: false,
        ContractId: contract.id,
      }),
    ])
  })

  afterAll(async () => {
    await app.close()
  })

  describe("POST /balances/deposit/:userId", () => {
    it("should return 401 when no profile is provided", () => {
      return supertest(app.getHttpServer())
        .post(`/balances/deposit/${clientProfile.id}`)
        .send({ amount: 50 })
        .expect(401)
        .expect({
          message: "Authentication required",
          error: "Unauthorized",
          statusCode: 401,
        })
    })

    it("should return 404 when user does not exist", () => {
      return supertest(app.getHttpServer())
        .post("/balances/deposit/999")
        .set("profile_id", clientProfile.id.toString())
        .send({ amount: 50 })
        .expect(404)
        .expect({
          message: "User not found",
          error: "Not Found",
          statusCode: 404,
        })
    })

    it("should return 400 when amount is not provided", () => {
      return supertest(app.getHttpServer())
        .post(`/balances/deposit/${clientProfile.id}`)
        .set("profile_id", clientProfile.id.toString())
        .expect(400)
        .expect({
          message: "Amount is required",
          error: "Bad Request",
          statusCode: 400,
        })
    })

    it("should return 400 when amount is negative", () => {
      return supertest(app.getHttpServer())
        .post(`/balances/deposit/${clientProfile.id}`)
        .set("profile_id", clientProfile.id.toString())
        .send({ amount: -50 })
        .expect(400)
        .expect({
          message: "Amount must be positive",
          error: "Bad Request",
          statusCode: 400,
        })
    })

    it("should return 403 when contractor tries to deposit", () => {
      return supertest(app.getHttpServer())
        .post(`/balances/deposit/${contractorProfile.id}`)
        .set("profile_id", contractorProfile.id.toString())
        .send({ amount: 50 })
        .expect(403)
        .expect({
          message: "Only clients can make deposits",
          error: "Forbidden",
          statusCode: 403,
        })
    })

    it("should return 400 when deposit exceeds 25% of total jobs to pay", async () => {
      const totalJobsToPay = unpaidJobs.reduce((sum, job) => sum + job.price, 0)
      const maxDeposit = totalJobsToPay * 0.25
      const excessiveAmount = maxDeposit + 1

      return supertest(app.getHttpServer())
        .post(`/balances/deposit/${clientProfile.id}`)
        .set("profile_id", clientProfile.id.toString())
        .send({ amount: excessiveAmount })
        .expect(400)
        .expect({
          message: "Deposit amount exceeds 25% of total jobs to pay",
          error: "Bad Request",
          statusCode: 400,
        })
    })

    it("should successfully deposit money within 25% limit", async () => {
      const totalJobsToPay = unpaidJobs.reduce((sum, job) => sum + job.price, 0)
      const depositAmount = Math.floor(totalJobsToPay * 0.25)
      const initialBalance = clientProfile.balance

      const response = await supertest(app.getHttpServer())
        .post(`/balances/deposit/${clientProfile.id}`)
        .set("profile_id", clientProfile.id.toString())
        .send({ amount: depositAmount })
        .expect(200)

      expect(response.body).toEqual({
        status: "success",
        data: {
          balance: initialBalance + depositAmount,
        },
      })

      // Verify balance was updated
      const updatedProfile = await Profile.findByPk(clientProfile.id)
      expect(updatedProfile.balance).toBe(initialBalance + depositAmount)
    })

    it("should handle concurrent deposits correctly", async () => {
      const depositAmount = 50 // Within 25% limit
      const initialBalance = clientProfile.balance

      // Make concurrent deposit requests
      const requests = [
        supertest(app.getHttpServer())
          .post(`/balances/deposit/${clientProfile.id}`)
          .set("profile_id", clientProfile.id.toString())
          .send({ amount: depositAmount }),
        supertest(app.getHttpServer())
          .post(`/balances/deposit/${clientProfile.id}`)
          .set("profile_id", clientProfile.id.toString())
          .send({ amount: depositAmount }),
      ]

      await Promise.all(requests)

      // Verify final balance is correct (should only process one deposit)
      const updatedProfile = await Profile.findByPk(clientProfile.id)
      expect(updatedProfile.balance).toBe(initialBalance + depositAmount)
    })
  })
}) 