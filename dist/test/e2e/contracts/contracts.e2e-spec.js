"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const contracts_module_1 = require("../../../src/modules/contracts/contracts.module");
const sequelize_1 = require("@nestjs/sequelize");
const contract_model_1 = require("../../../src/modules/contracts/models/contract.model");
const profile_model_1 = require("../../../src/modules/profiles/models/profile.model");
const job_model_1 = require("../../../src/modules/jobs/models/job.model");
describe("ContractsController (e2e)", () => {
    let app;
    let contract;
    let clientProfile;
    let contractorProfile;
    jest.setTimeout(30000);
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [
                sequelize_1.SequelizeModule.forRoot({
                    dialect: "sqlite",
                    storage: ":memory:",
                    autoLoadModels: true,
                    synchronize: true,
                    models: [contract_model_1.Contract, profile_model_1.Profile, job_model_1.Job],
                    logging: false,
                }),
                contracts_module_1.ContractsModule,
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        await profile_model_1.Profile.sync({ force: true });
        await contract_model_1.Contract.sync({ force: true });
        await job_model_1.Job.sync({ force: true });
        clientProfile = await profile_model_1.Profile.create({
            id: 1,
            type: "client",
            firstName: "John",
            lastName: "Doe",
            profession: "Manager",
            balance: 1000,
        });
        contractorProfile = await profile_model_1.Profile.create({
            id: 2,
            type: "contractor",
            firstName: "Jane",
            lastName: "Smith",
            profession: "Developer",
            balance: 0,
        });
        contract = await contract_model_1.Contract.create({
            id: 1,
            terms: "Test contract",
            status: "new",
            ClientId: clientProfile.id,
            ContractorId: contractorProfile.id,
        });
    });
    afterAll(async () => {
        await contract_model_1.Contract.sync({ force: true });
        await profile_model_1.Profile.sync({ force: true });
        await job_model_1.Job.sync({ force: true });
        await app.close();
    });
    describe("GET /contracts/:id", () => {
        it("should return 401 when no profile is provided", () => {
            return request(app.getHttpServer())
                .get("/contracts/1")
                .expect(401)
                .expect({
                message: "Authentication required",
                error: "Unauthorized",
                statusCode: 401,
            });
        });
        it("should return 404 when contract is not found", () => {
            return request(app.getHttpServer())
                .get("/contracts/999")
                .set("profile_id", clientProfile.id.toString())
                .expect(404)
                .expect({
                message: "Contract with ID 999 not found",
                error: "Not Found",
                statusCode: 404,
            });
        });
        it("should return contract when client requests their contract", async () => {
            const response = await request(app.getHttpServer())
                .get(`/contracts/${contract.id}`)
                .set("profile_id", clientProfile.id.toString())
                .expect(200);
            expect(response.body).toEqual({
                status: "success",
                data: expect.objectContaining({
                    id: contract.id,
                    terms: contract.terms,
                    status: contract.status,
                    ClientId: clientProfile.id,
                    ContractorId: contractorProfile.id,
                }),
            });
        });
    });
});
//# sourceMappingURL=contracts.e2e-spec.js.map