const request = require("supertest")
const app = require("../../src/app")
const { Profile, Contract } = require("../../src/model")

describe("GET /contracts/:id", () => {
  let client
  let contract

  beforeEach(async () => {
    client = await Profile.create({
      firstName: "John",
      lastName: "Doe",
      profession: "Client",
      balance: 1000,
      type: "client",
    })

    contract = await Contract.create({
      terms: "Test contract",
      status: "new",
      ClientId: client.id,
    })
  })

  it("should return 401 if profile header is missing", async () => {
    const response = await request(app).get(`/contracts/${contract.id}`)
    expect(response.status).toBe(401)
  })

  it("should return contract if it belongs to client profile", async () => {
    const response = await request(app)
      .get(`/contracts/${contract.id}`)
      .set("profile_id", client.id)

    expect(response.status).toBe(200)
    expect(response.body.id).toBe(contract.id)
  })
})
