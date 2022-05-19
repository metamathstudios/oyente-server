const rinkeby = require('../src/rinkeby-event-resolver')
const moonbase = require('../src/moonbase-event-filter')
const { ethers } = require('ethers')
const db = require('@metamathstudios/redis-wrapper')
const cluster = require('cluster')
// const totalCPUs = require("os").cpus().length
const totalCPUs = 1

const moonbaseChainId = '0x507'

const getDate = () => {
  const d = new Date()
  const datetime = d.toLocaleString()
  return datetime
}

const registerToRedis = async (key, value) => {
  try {await db.start()} catch (e) {console.log(`[${getDate()}] OYENTE: A new request to open DB Socket denied.`)}
  const receipt = await db.setValue(key, value)
  if (receipt === true) {
    console.log(`[${getDate()}] OYENTE: Transaction ID ${key} saved to database`)
  }
  try {await db.stop()} catch (e) {console.log(`[${getDate()}] OYENTE: A new request to close DB Socket denied.`)}
}

const checkTxStatus = async (key) => {
  try {await db.start()} catch (e) {console.log(`[${getDate()}] OYENTE: A new request to open DB Socket denied.`)}
  const data = await db.getValue(key)
  try {await db.stop()} catch (e) {console.log(`[${getDate()}] OYENTE: A new request to close DB Socket denied.`)}
  return data
}

if (cluster.isMaster) {
  console.log(`[${getDate()}] OYENTE: MOONBASE to RINKEBY bridge is online! `)

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
    const contract = await moonbase.myContract()
    const event = await moonbase.getSwapsFilter()

    console.log(`[${getDate()}] OYENTE: Listening to contract ${contract.address}...`)

    contract.on(event, async (
      event,
      fromAddress,
      tokenAddress,
      targetAddress,
      amount,
      targetChain,
      transaction) => {
      if (transaction.args.targetChainId !== 4) { return }
      const date = getDate()
      const redisData = {
        from: transaction.args.fromAddress,
        to: transaction.args.toAddress,
        origin: moonbaseChainId,
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

      await rinkeby.fillSwap(
        redisKey,
        transaction.transactionHash,
        transaction.args.masterErc20Addr,
        transaction.args.toAddress,
        transaction.args.amount,
        moonbaseChainId,
        redisData
      )
    })
  }

  listenerAgent()
}
