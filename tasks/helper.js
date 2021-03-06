const { ethers } = require("ethers");
const { getContractAt } = require("@nomiclabs/hardhat-ethers/internal/helpers");

// Helper method for fetching environment variables from .env
function getEnvVariable(key, defaultValue) {
  if (process.env[key]) {
    return process.env[key];
  }
  if (!defaultValue) {
    throw `${key} is not defined and no default value was provided`;
  }
  return defaultValue;
}

function getPrivKey(privKey) {
  if (privKey) {
    return privKey;
  }
  return getEnvVariable("ACCOUNT_PRIVATE_KEY");
}

// Helper method for fetching a connection provider to the Ethereum network
function getProvider() {
  const network = getEnvVariable("NETWORK", "rinkeby");

  if (network == "ganache") {
    // const url = "http://localhost:8545"; // URL for Ganache
    const url = "http://localhost:7545"; // URL for Ganache(UI version)
    return new ethers.providers.JsonRpcProvider(url);
  } else {
    return ethers.getDefaultProvider(network, {
      alchemy: getEnvVariable("ALCHEMY_KEY"),
    });
  }
}

// Helper method for fetching a wallet account using an environment variable for the PK
function getOwnerAccount() {
  return new ethers.Wallet(
    getEnvVariable("ACCOUNT_PRIVATE_KEY"),
    getProvider()
  );
}

// Helper method for fetching a wallet account using private key
function getAccount(privKey) {
  return new ethers.Wallet(
    getPrivKey(privKey),
    getProvider()
  );
}

// Helper method for fetching a contract instance at a given address
function getContract(contractName, hre) {
  const account = getOwnerAccount();
  return getContractAt(
    hre,
    contractName,
    getEnvVariable("CONTRACT_ADDRESS"),
    account
  );
}

// Helper method for fetching a contract instance by private key
function getContractByKey(contractName, privKey, hre) {
  const account = getAccount(privKey);
  return getContractAt(
    hre,
    contractName,
    getEnvVariable("CONTRACT_ADDRESS"),
    account
  );
}

module.exports = {
  getEnvVariable,
  getPrivKey,
  getProvider,
  getAccount,
  getOwnerAccount,
  getContract,
  getContractByKey,
};
