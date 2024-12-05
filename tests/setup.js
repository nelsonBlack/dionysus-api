const { Profile, Contract } = require("../src/model")
const { sequelize } = require("../src/model")

beforeAll(async () => {
  await sequelize.sync({ force: true })
})

afterAll(async () => {
  await sequelize.close()
})

beforeEach(async () => {
  await Profile.destroy({ where: {} })
  await Contract.destroy({ where: {} })
})
