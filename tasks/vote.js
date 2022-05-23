const { task } = require("hardhat/config");
const { getContract } = require("./helper");

task("create-voting", "Create a vote")
  .addParam("candidates", "Candidate List of Vote")
  .setAction(async function (taskArguments, hre) {
    const contract = await getContract("Voting", hre);

    const tx = await contract.createVoting(
      taskArguments.candidates.split(","),
      {
        gasLimit: 500_000,
      }
    );

    console.log(`Vote created: ${tx.hash}`);
  });

task("participate-vote", "Participate to one vote")
  .addParam("voteid", "Index of Vote")
  .addParam("candidate", "The candidate to vote")
  .setAction(async function (taskArguments, hre) {
    const contract = await getContract("Voting", hre);

    const tx = await contract.participateVote(
      taskArguments.voteid,
      taskArguments.candidate,
      {
        gasLimit: 500_000,
      }
    );

    console.log(tx);
  });

task("end-voting", "End a voting")
.addParam("voteid", "Index of Vote")
.setAction(async function (taskArguments, hre) {
  const contract = await getContract("Voting", hre);

  const tx = await contract.endVoting(
    taskArguments.voteid,
    {
      gasLimit: 500_000,
    }
  );

  console.log(tx);
});

task("get-vote-candidates", "Get candidates of the vote")
  .addParam("voteid", "Index of Vote")
  .setAction(async function (taskArguments, hre) {
    const contract = await getContract("Voting", hre);

    const tx = await contract.getVoteCandidates(taskArguments.voteid, {
      gasLimit: 500_000,
    });
    console.log(tx);
  });
