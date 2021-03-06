const rinkeby = require('../src/rinkeby-event-filter')
const moonbase = require('../src/moonbase-event-resolver')
const { ethers } = require('ethers')
const db = require('@metamathstudios/redis-wrapper')
const cluster = require('cluster')
// const totalCPUs = require("os").cpus().length
const totalCPUs = 1

const rinkebyChainId = '0x4'

const getDate = () => {
  const d = new Date()
  const datetime = d.toLocaleString()
  return datetime
}

const registerToRedis = async (key, value) => {
  try {await db.start()} catch (e) {console.log(`[${getDate()}] OYENTE: ${e}`)}
  const receipt = await db.setValue(key, value)
  if (receipt === true) {
    console.log(`[${getDate()}] OYENTE: Transaction ID ${key} saved to database`)
  }
  try {await db.stop()} catch (e) {console.log(`[${getDate()}] OYENTE: ${e}`)}
}

const checkTxStatus = async (key) => {
  try {await db.start()} catch (e) {console.log(`[${getDate()}] OYENTE: ${e}`)}
  const data = await db.getValue(key)
  try {await db.stop()} catch (e) {console.log(`[${getDate()}] OYENTE: ${e}`)}
  return data
}

if (cluster.isMaster) {
  console.log(`[${getDate()}] OYENTE: RINKEBY to MOONBASE bridge is online! `)

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`[${getDate()}] OYENTE: Something is wrong! Re-starting Oyente...`)
    cluster.fork()
  })
} else {
  const listenerAgent = async () => {
    const contract = await rinkeby.myContract()
    const event = await rinkeby.getSwapsFilter()

    console.log(`[${getDate()}] OYENTE: Listening to contract ${contract.address}...`)

    contract.on(event, async (
      event,
      fromAddress,
      tokenAddress,
      targetAddress,
      amount,
      targetChain,
      transaction) => {
      if (transaction.args.targetChainId !== 1287) { return }
      const date = getDate()
      const redisData = {
        from: transaction.args.fromAddress,
        to: transaction.args.toAddress,
        origin: rinkebyChainId,
        target: `0x${transaction.args.targetChainId.toString(16)}`,
        tx: transaction.transactionHash,
        status: 'initiated',
        amount: ethers.utils.formatEther(transaction.args.amount)
      }

      const redisKey = `${transaction.transactionHash.slice(-12)}`
      const checkTx = await checkTxStatus(redisKey)

      if (checkTx?.status === 'finalized') { return }

      registerToRedis(redisKey, redisData)

      console.log(`[${date}] TXHASH: ${transaction.transactionHash}`)
      console.log(`[${date}] TO    : ${transaction.args.toAddress} with TARGET CHAIN: ${transaction.args.targetChainId}`)
      console.log(`[${date}] AMOUNT: ${ethers.utils.formatEther(transaction.args.amount)}`)
      console.log(`[${date}] TOKEN : ${transaction.args.masterErc20Addr}`)
      console.log(`[${date}] FROM  : ${transaction.args.fromAddress}`)

      await moonbase.fillSwap(
        redisKey,
        transaction.transactionHash,
        transaction.args.masterErc20Addr,
        transaction.args.toAddress,
        transaction.args.amount,
        rinkebyChainId,
        redisData
      )
    })
  }

  listenerAgent()
}
