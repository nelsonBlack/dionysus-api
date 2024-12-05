const ContractService = require("../../src/services/ContractService")

describe("ContractService", () => {
  let contractService
  let mockContract

  beforeEach(() => {
    mockContract = {
      findOne: jest.fn(),
    }
  })

  describe("getContractById", () => {
    it("should return contract for valid client request", async () => {
      const req = {
        app: {
          get: () => ({ Contract: mockContract }),
        },
        params: { id: 1 },
        profile: { id: 5, type: "client" },
      }
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      }

      const sampleContract = { id: 1, terms: "Test Contract" }
      mockContract.findOne.mockResolvedValue(sampleContract)

      await ContractService.getContractById(req, res)
      expect(res.json).toHaveBeenCalledWith(sampleContract)
    })
  })
})
