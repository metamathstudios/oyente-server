const { ethers } = require('ethers')
const { contractAbiRinkeby, contractAddressRinkeby } = require('../contract.json')
require('dotenv').config()

const RPCNodeProvider = process.env.RINKEBY
const ethersProvider = new ethers.providers.JsonRpcProvider(RPCNodeProvider)
const contract = new ethers.Contract(
  contractAddressRinkeby,
  contractAbiRinkeby,
  ethersProvider.getSigner(0)
)

const myContract = async () => {
  return contract
}

const getBlock = async () => {
  const blockNumber = await ethersProvider.getBlockNumber()
  return blockNumber
}

const getSwapsFilter = async () => {
  const filter = contract.filters.SwapStarted()
  return filter
}

module.exports = {
  getBlock,
  getSwapsFilter,
  myContract
}
