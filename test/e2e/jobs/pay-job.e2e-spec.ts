import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import supertest from "supertest"
import { JobsModule } from "../../../src/modules/jobs/jobs.module"
import { SequelizeModule } from "@nestjs/sequelize"
import { Contract } from "../../../src/modules/contracts/models/contract.model"
import { Profile } from "../../../src/modules/profiles/models/profile.model"
import { Job } from "../../../src/modules/jobs/models/job.model"

describe("JobsController (e2e) - Pay Job", () => {
  let app: INestApplication
  let clientProfile: Profile
  let contractorProfile: Profile
  let activeContract: Contract
  let unpaidJob: Job

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

    unpaidJob = await Job.create({
      description: "Unpaid job",
      price: 100,
      paid: false,
      ContractId: activeContract.id,
    })
  })

  afterAll(async () => {
    await Job.sync({ force: true })
    await Contract.sync({ force: true })
    await Profile.sync({ force: true })
    await app.close()
  })

  describe("POST /jobs/:job_id/pay", () => {
    it("should return 401 when no profile is provided", () => {
      return supertest(app.getHttpServer())
        .post(`/jobs/${unpaidJob.id}/pay`)
        .expect(401)
        .expect({
          message: "Authentication required",
          error: "Unauthorized",
          statusCode: 401,
        })
    })

    it("should return 404 when job does not exist", () => {
      return supertest(app.getHttpServer())
        .post("/jobs/999/pay")
        .set("profile_id", clientProfile.id.toString())
        .expect(404)
        .expect({
          message: "Job not found",
          error: "Not Found",
          statusCode: 404,
        })
    })

    it("should return 403 when non-client tries to pay", async () => {
      return supertest(app.getHttpServer())
        .post(`/jobs/${unpaidJob.id}/pay`)
        .set("profile_id", contractorProfile.id.toString())
        .expect(403)
        .expect({
          message: "Only clients can pay for jobs",
          error: "Forbidden",
          statusCode: 403,
        })
    })

    it("should return 400 when client has insufficient balance", async () => {
      const expensiveJob = await Job.create({
        description: "Expensive job",
        price: 2000, // More than client's balance
        paid: false,
        ContractId: activeContract.id,
      })

      return supertest(app.getHttpServer())
        .post(`/jobs/${expensiveJob.id}/pay`)
        .set("profile_id", clientProfile.id.toString())
        .expect(400)
        .expect({
          message: "Insufficient balance",
          error: "Bad Request",
          statusCode: 400,
        })
    })

    it("should return 400 when job is already paid", async () => {
      const paidJob = await Job.create({
        description: "Already paid job",
        price: 50,
        paid: true,
        paymentDate: new Date(),
        ContractId: activeContract.id,
      })

      return supertest(app.getHttpServer())
        .post(`/jobs/${paidJob.id}/pay`)
        .set("profile_id", clientProfile.id.toString())
        .expect(400)
        .expect({
          message: "Job is already paid",
          error: "Bad Request",
          statusCode: 400,
        })
    })

    it("should successfully pay for a job", async () => {
      const initialClientBalance = clientProfile.balance
      const initialContractorBalance = contractorProfile.balance
      const jobPrice = unpaidJob.price

      const response = await supertest(app.getHttpServer())
        .post(`/jobs/${unpaidJob.id}/pay`)
        .set("profile_id", clientProfile.id.toString())
        .expect(200)

      // Verify response
      expect(response.body).toEqual({
        status: "success",
        data: expect.objectContaining({
          paid: true,
          paymentDate: expect.any(String),
        }),
      })

      // Verify balances were updated
      const updatedClient = await Profile.findByPk(clientProfile.id)
      const updatedContractor = await Profile.findByPk(contractorProfile.id)
      
      expect(updatedClient.balance).toBe(initialClientBalance - jobPrice)
      expect(updatedContractor.balance).toBe(initialContractorBalance + jobPrice)

      // Verify job was marked as paid
      const updatedJob = await Job.findByPk(unpaidJob.id)
      expect(updatedJob.paid).toBe(true)
      expect(updatedJob.paymentDate).toBeTruthy()
    })

    it("should prevent concurrent payments of the same job", async () => {
      const job = await Job.create({
        description: "Concurrent test job",
        price: 100,
        paid: false,
        ContractId: activeContract.id,
      })

      // Attempt concurrent payments
      const paymentPromises = [
        supertest(app.getHttpServer())
          .post(`/jobs/${job.id}/pay`)
          .set("profile_id", clientProfile.id.toString()),
        supertest(app.getHttpServer())
          .post(`/jobs/${job.id}/pay`)
          .set("profile_id", clientProfile.id.toString()),
      ]

      const results = await Promise.all(paymentPromises)
      
      // One should succeed, one should fail
      const successCount = results.filter(r => r.status === 200).length
      const failCount = results.filter(r => r.status === 400).length
      
      expect(successCount).toBe(1)
      expect(failCount).toBe(1)

      // Verify job was paid exactly once
      const updatedJob = await Job.findByPk(job.id)
      expect(updatedJob.paid).toBe(true)
      expect(updatedJob.paymentDate).toBeTruthy()
    })

    it("should maintain data consistency in case of partial failure", async () => {
      const initialClientBalance = clientProfile.balance
      const initialContractorBalance = contractorProfile.balance
      
      // Force a failure after balance update but before job update
      jest.spyOn(Job.prototype, 'save').mockRejectedValueOnce(new Error('Forced failure'))

      await supertest(app.getHttpServer())
        .post(`/jobs/${unpaidJob.id}/pay`)
        .set("profile_id", clientProfile.id.toString())
        .expect(500)

      // Verify no changes were made (transaction rollback)
      const updatedClient = await Profile.findByPk(clientProfile.id)
      const updatedContractor = await Profile.findByPk(contractorProfile.id)
      const updatedJob = await Job.findByPk(unpaidJob.id)

      expect(updatedClient.balance).toBe(initialClientBalance)
      expect(updatedContractor.balance).toBe(initialContractorBalance)
      expect(updatedJob.paid).toBe(false)
      expect(updatedJob.paymentDate).toBeFalsy()
    })

    it("should prevent SQL injection in job_id parameter", async () => {
      const maliciousId = "1 OR 1=1"
      
      await supertest(app.getHttpServer())
        .post(`/jobs/${maliciousId}/pay`)
        .set("profile_id", clientProfile.id.toString())
        .expect(400) // Should fail validation
    })

    it("should verify job belongs to the client's contract", async () => {
      const otherClient = await Profile.create({
        type: "client",
        firstName: "Other",
        lastName: "Client",
        profession: "Manager",
        balance: 1000,
      })

      await supertest(app.getHttpServer())
        .post(`/jobs/${unpaidJob.id}/pay`)
        .set("profile_id", otherClient.id.toString())
        .expect(403)
        .expect({
          message: "Job does not belong to your contracts",
          error: "Forbidden",
          statusCode: 403,
        })
    })

    it("should handle race conditions in balance updates", async () => {
      const job1 = await Job.create({
        description: "Race condition test job 1",
        price: 400,
        paid: false,
        ContractId: activeContract.id,
      })

      const job2 = await Job.create({
        description: "Race condition test job 2",
        price: 400,
        paid: false,
        ContractId: activeContract.id,
      })

      // Try to pay both jobs concurrently (total exceeds balance)
      const results = await Promise.all([
        supertest(app.getHttpServer())
          .post(`/jobs/${job1.id}/pay`)
          .set("profile_id", clientProfile.id.toString()),
        supertest(app.getHttpServer())
          .post(`/jobs/${job2.id}/pay`)
          .set("profile_id", clientProfile.id.toString()),
      ])

      // Only one payment should succeed
      const successCount = results.filter(r => r.status === 200).length
      expect(successCount).toBeLessThanOrEqual(1)

      // Verify final balance is consistent
      const finalClient = await Profile.findByPk(clientProfile.id)
      expect(finalClient.balance).toBeGreaterThanOrEqual(0)
    })
  })
}) 