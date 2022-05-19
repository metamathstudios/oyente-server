const { ethers } = require('ethers')
const { contractAbiRinkeby, contractAddressRinkeby } = require('../contract.json')
const db = require('@metamathstudios/redis-wrapper')
require('dotenv').config()

const getDate = () => {
  const d = new Date()
  const datetime = d.toLocaleString()
  return datetime
}

const RPCNodeProvider = process.env.RINKEBY
const ethersProvider = new ethers.providers.JsonRpcProvider(RPCNodeProvider)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethersProvider)
const contract = new ethers.Contract(
  contractAddressRinkeby,
  contractAbiRinkeby,
  wallet
)

const registerToRedis = async (key, value) => {
  try {await db.start()} catch (e) {console.log(`[${getDate()}] OYENTE: ${e}`)}
  const receipt = await db.setValue(key, value)
  if (receipt === true) {
    console.log(`[${getDate()}] OYENTE: Transaction ID ${key} updated to database`)
  }
  try {await db.stop()} catch (e) {console.log(`[${getDate()}] OYENTE: ${e}`)}
}

const fillSwap = async (
  key,
  txHash,
  token,
  toAddress,
  amount,
  fromChain,
  data) => {
  try {
    await contract.fillSwapRequest(
      txHash,
      token,
      toAddress,
      ethers.utils.formatUnits(amount, 0),
      fromChain
    )
      .then(() => {
        data.status = 'finalized'
        registerToRedis(key, data)
      })
  } catch (error) {
    data.status = 'error'
    registerToRedis(key, data)
    console.log(`[${getDate()}] OYENTE ${error}`)
  }
}

module.exports = { fillSwap }
