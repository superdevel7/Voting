const { task } = require("hardhat/config");
const { getAccount } = require("./helper");

task("deploy", "Deploys the Voting.sol contract").setAction(async function (
  taskArguments,
  hre
) {
  const votingContractFactory = await hre.ethers.getContractFactory(
    "Voting",
    getAccount(hre)
  );

  const voting = await votingContractFactory.deploy();
  console.log(`Contract deployed to address: ${voting.address}`);
});
