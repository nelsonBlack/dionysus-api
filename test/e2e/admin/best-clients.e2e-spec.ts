import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import supertest from "supertest"
import { SequelizeModule } from "@nestjs/sequelize"
import { Contract } from "../../../src/modules/contracts/models/contract.model"
import { Profile } from "../../../src/modules/profiles/models/profile.model"
import { Job } from "../../../src/modules/jobs/models/job.model"
import { AdminModule } from "../../../src/modules/admin/admin.module"

describe("AdminController (e2e) - Best Clients", () => {
  let app: INestApplication
  let clients: Profile[]
  let contractors: Profile[]
  let contracts: Contract[]

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
        AdminModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  beforeEach(async () => {
    // Clear all data before each test
    await Job.destroy({ where: {}, force: true })
    await Contract.destroy({ where: {}, force: true })
    await Profile.destroy({ where: {}, force: true })

    // Create test clients
    clients = await Promise.all([
      Profile.create({
        firstName: "John",
        lastName: "Client",
        profession: "Manager",
        balance: 1000,
        type: "client",
      }),
      Profile.create({
        firstName: "Jane",
        lastName: "Spender",
        profession: "Manager",
        balance: 1000,
        type: "client",
      }),
      Profile.create({
        firstName: "Bob",
        lastName: "Buyer",
        profession: "Manager",
        balance: 1000,
        type: "client",
      }),
    ])

    // Create one contractor
    contractors = await Promise.all([
      Profile.create({
        firstName: "Dave",
        lastName: "Developer",
        profession: "Developer",
        balance: 0,
        type: "contractor",
      }),
    ])

    // Create contracts
    contracts = await Promise.all(
      clients.map((client) =>
        Contract.create({
          terms: `Contract for ${client.firstName}`,
          status: "in_progress",
          ClientId: client.id,
          ContractorId: contractors[0].id,
        })
      )
    )
  })

  afterAll(async () => {
    await app.close()
  })

  describe("GET /admin/best-clients", () => {
    beforeEach(async () => {
      // Clear jobs before each test
      await Job.destroy({ where: {}, force: true })
    })

    it("should return 400 when date parameters are missing", () => {
      return supertest(app.getHttpServer())
        .get("/admin/best-clients")
        .expect(400)
        .expect({
          statusCode: 400,
          message: [
            "start must be a valid ISO 8601 date string",
            "Start date is required",
            "end must be a valid ISO 8601 date string",
            "End date is required",
          ],
          error: "Bad Request",
        })
    })

    it("should return top 2 clients by default", async () => {
      const now = new Date()
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)

      // Create jobs with different amounts
      await Promise.all([
        Job.create({
          description: "Big Job",
          price: 200,
          paid: true,
          paymentDate: now,
          ContractId: contracts[0].id,
        }),
        Job.create({
          description: "Medium Job",
          price: 100,
          paid: true,
          paymentDate: now,
          ContractId: contracts[1].id,
        }),
        Job.create({
          description: "Small Job",
          price: 50,
          paid: true,
          paymentDate: now,
          ContractId: contracts[2].id,
        }),
      ])

      const response = await supertest(app.getHttpServer())
        .get(
          `/admin/best-clients?start=${weekAgo.toISOString()}&end=${now.toISOString()}`
        )
        .expect(200)

      expect(response.body).toHaveLength(2) // Default limit
      expect(response.body).toEqual([
        {
          id: clients[0].id,
          fullName: `${clients[0].firstName} ${clients[0].lastName}`,
          paid: 200,
        },
        {
          id: clients[1].id,
          fullName: `${clients[1].firstName} ${clients[1].lastName}`,
          paid: 100,
        },
      ])
    })

    it("should respect the limit parameter", async () => {
      const now = new Date()
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)

      // Create jobs with different amounts
      await Promise.all([
        Job.create({
          description: "Big Job",
          price: 200,
          paid: true,
          paymentDate: now,
          ContractId: contracts[0].id,
        }),
        Job.create({
          description: "Medium Job",
          price: 100,
          paid: true,
          paymentDate: now,
          ContractId: contracts[1].id,
        }),
        Job.create({
          description: "Small Job",
          price: 50,
          paid: true,
          paymentDate: now,
          ContractId: contracts[2].id,
        }),
      ])

      const response = await supertest(app.getHttpServer())
        .get(
          `/admin/best-clients?start=${weekAgo.toISOString()}&end=${now.toISOString()}&limit=3`
        )
        .expect(200)

      expect(response.body).toHaveLength(3)
      expect(response.body).toEqual([
        {
          id: clients[0].id,
          fullName: `${clients[0].firstName} ${clients[0].lastName}`,
          paid: 200,
        },
        {
          id: clients[1].id,
          fullName: `${clients[1].firstName} ${clients[1].lastName}`,
          paid: 100,
        },
        {
          id: clients[2].id,
          fullName: `${clients[2].firstName} ${clients[2].lastName}`,
          paid: 50,
        },
      ])
    })

    it("should only count paid jobs within date range", async () => {
      const now = new Date()
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(now.getDate() - 2)
      const lastMonth = new Date()
      lastMonth.setMonth(now.getMonth() - 1)

      // Create jobs with different dates
      await Promise.all([
        Job.create({
          description: "Recent Job",
          price: 100,
          paid: true,
          paymentDate: now,
          ContractId: contracts[0].id,
        }),
        Job.create({
          description: "Old Job",
          price: 200,
          paid: true,
          paymentDate: lastMonth,
          ContractId: contracts[0].id,
        }),
      ])

      const response = await supertest(app.getHttpServer())
        .get(
          `/admin/best-clients?start=${twoDaysAgo.toISOString()}&end=${now.toISOString()}`
        )
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0]).toEqual({
        id: clients[0].id,
        fullName: `${clients[0].firstName} ${clients[0].lastName}`,
        paid: 100, // Only counts the recent job
      })
    })

    it("should return 404 when no paid jobs exist in date range", async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      return supertest(app.getHttpServer())
        .get(
          `/admin/best-clients?start=${futureDate.toISOString()}&end=${futureDate.toISOString()}`
        )
        .expect(404)
        .expect({
          statusCode: 404,
          message: "No paid jobs found in the specified date range",
          error: "Not Found",
        })
    })
  })
})
