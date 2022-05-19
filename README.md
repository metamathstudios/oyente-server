# 🚀 Quick Start Oyente Servers

✅ Clone or fork `oyente-server`:

```sh
git clone https://github.com/metamathstudios/oyente-server.git
```

💿 Install dependencies with yarn:

```sh
cd oyente-server
yarn install
```

# 📰 Setting Up Environment Variables

✅ Create a `.env` file with the following information:

```sh
RINKEBY='YOUR_RINKEBY_RPC_NODE_PROVIDER_URL'
MUMBAI='YOUR_MUMBAI_RPC_NODE_PROVIDER_URL'
MOONBASE='YOUR_MOONBASE_RPC_NODE_PROVIDER_URL'
REDIS_USER='default'
REDIS_PW='YOUR_REDIS_CLOUD_PASSWORD'
REDIS_HOST='YOUR_REDIS_CLOUD_HOST_URL'
REDIS_PORT='YOUR_REDIS_CLOUD_HOST_PORT'
PRIVATE_KEY='YOUR_WALLET_PRIVATE_KEY'
```

`PRIVATE_KEY` must be the contract owner or authority responsible for [Portales Smart Contracts](https://github.com/metamathstudios/portales-by-metamath/tree/dev-blockchain) maintenance.

# 🤖 Booting servers

✅ Moonbase to Rinkeby bridge agent:

```sh
clear && node servers/oyenteMOONETH.js
```

✅ Rinkeby to Moonbase bridge agent:

```sh
clear && node servers/oyenteETHMOON.js
```

