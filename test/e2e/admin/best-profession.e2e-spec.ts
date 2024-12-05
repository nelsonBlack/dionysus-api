import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import supertest from "supertest"
import { SequelizeModule } from "@nestjs/sequelize"
import { Contract } from "../../../src/modules/contracts/models/contract.model"
import { Profile } from "../../../src/modules/profiles/models/profile.model"
import { Job } from "../../../src/modules/jobs/models/job.model"
import { AdminModule } from "../../../src/modules/admin/admin.module"
describe("AdminController (e2e) - Best Profession", () => {
  let app: INestApplication
  let developers: Profile[]
  let designers: Profile[]
  let clients: Profile[]
  let contracts: Contract[]
  let jobs: Job[]

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

    // Create base test data (profiles and contracts)
    developers = await Promise.all([
      Profile.create({
        firstName: "John",
        lastName: "Dev",
        profession: "Developer",
        balance: 0,
        type: "contractor",
      }),
      Profile.create({
        firstName: "Jane",
        lastName: "Dev",
        profession: "Developer",
        balance: 0,
        type: "contractor",
      }),
    ])

    designers = await Promise.all([
      Profile.create({
        firstName: "Alice",
        lastName: "Design",
        profession: "Designer",
        balance: 0,
        type: "contractor",
      }),
      Profile.create({
        firstName: "Bob",
        lastName: "Design",
        profession: "Designer",
        balance: 0,
        type: "contractor",
      }),
    ])

    clients = await Promise.all([
      Profile.create({
        firstName: "Client",
        lastName: "One",
        profession: "Manager",
        balance: 1000,
        type: "client",
      }),
      Profile.create({
        firstName: "Client",
        lastName: "Two",
        profession: "Manager",
        balance: 1000,
        type: "client",
      }),
    ])

    // Create contracts
    contracts = await Promise.all([
      // Developer contracts
      Contract.create({
        terms: "Dev Contract 1",
        status: "in_progress",
        ClientId: clients[0].id,
        ContractorId: developers[0].id,
      }),
      Contract.create({
        terms: "Dev Contract 2",
        status: "in_progress",
        ClientId: clients[1].id,
        ContractorId: developers[1].id,
      }),
      // Designer contracts
      Contract.create({
        terms: "Design Contract 1",
        status: "in_progress",
        ClientId: clients[0].id,
        ContractorId: designers[0].id,
      }),
      Contract.create({
        terms: "Design Contract 2",
        status: "in_progress",
        ClientId: clients[1].id,
        ContractorId: designers[1].id,
      }),
    ])

    // Create jobs with different payment dates
    const now = new Date()
    const yesterday = new Date(now.setDate(now.getDate() - 1))
    const lastWeek = new Date(now.setDate(now.getDate() - 7))
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1))

    jobs = await Promise.all([
      // Developer jobs
      Job.create({
        description: "Dev Job 1",
        price: 100,
        paid: true,
        paymentDate: yesterday,
        ContractId: contracts[0].id,
      }),
      Job.create({
        description: "Dev Job 2",
        price: 200,
        paid: true,
        paymentDate: lastWeek,
        ContractId: contracts[1].id,
      }),
      // Designer jobs
      Job.create({
        description: "Design Job 1",
        price: 150,
        paid: true,
        paymentDate: yesterday,
        ContractId: contracts[2].id,
      }),
      Job.create({
        description: "Design Job 2",
        price: 50,
        paid: true,
        paymentDate: lastMonth,
        ContractId: contracts[3].id,
      }),
      // Unpaid jobs (should not count)
      Job.create({
        description: "Unpaid Dev Job",
        price: 500,
        paid: false,
        ContractId: contracts[0].id,
      }),
      Job.create({
        description: "Unpaid Design Job",
        price: 500,
        paid: false,
        ContractId: contracts[2].id,
      }),
    ])
  })

  afterAll(async () => {
    await app.close()
  })

  describe("GET /admin/best-profession", () => {
    beforeEach(async () => {
      // Only clear jobs before each test
      await Job.destroy({ where: {}, force: true })
    })

    it("should return 400 when date parameters are missing", () => {
      return supertest(app.getHttpServer())
        .get("/admin/best-profession")
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

    it("should return the profession with highest earnings in date range", async () => {
      const now = new Date()
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)

      await Job.create({
        description: "Dev Job 1",
        price: 100,
        paid: true,
        paymentDate: now,
        ContractId: contracts[0].id,
      })

      const response = await supertest(app.getHttpServer())
        .get(
          `/admin/best-profession?start=${weekAgo.toISOString()}&end=${now.toISOString()}`
        )
        .expect(200)

      expect(response.body).toEqual({
        profession: "Developer",
        earned: 100,
      })
    })

    it("should only count paid jobs within date range", async () => {
      const now = new Date()
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(now.getDate() - 2)

      await Job.create({
        description: "Design Job 1",
        price: 150,
        paid: true,
        paymentDate: now,
        ContractId: contracts[2].id,
      })

      const response = await supertest(app.getHttpServer())
        .get(
          `/admin/best-profession?start=${twoDaysAgo.toISOString()}&end=${now.toISOString()}`
        )
        .expect(200)

      expect(response.body).toEqual({
        profession: "Designer",
        earned: 150,
      })
    })
  })
})
