class ContractService {
  async getContractById(req, res) {
    try {
      const { Contract } = req.app.get("models")
      const { id } = req.params
      const profile = req.profile

      const ownershipField =
        profile.type === "client"
          ? { ClientId: profile.id }
          : { ContractorId: profile.id }

      const contract = await Contract.findOne({
        where: {
          id,
          ...ownershipField,
        },
      })

      if (!contract) {
        return res.status(404).json({
          error: "Contract not found",
        })
      }

      return res.json(contract)
    } catch (error) {
      return res.status(500).json({
        error: "Internal server error",
      })
    }
  }
}

module.exports = new ContractService()
