const { task } = require("hardhat/config");
const { getContract } = require("./helper");
const { getContractByKey } = require("./helper");

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
  .addParam("participant", "The private key of the participant")
  .setAction(async function (taskArguments, hre) {
    const contract = await getContractByKey("Voting", taskArguments.participant, hre);

    var exp = ethers.BigNumber.from("10").pow(15);
    const ethValue = ethers.BigNumber.from("10").mul(exp);

    const tx = await contract.participateVote(
      taskArguments.voteid,
      taskArguments.candidate,
      {
        gasLimit: 500_000,
        value: ethValue,
      }
    );

    console.log(tx);
  });

task("end-voting", "End a voting")
  .addParam("voteid", "Index of Vote")
  .addParam("participant", "The private key of the participant")
  .setAction(async function (taskArguments, hre) {
  const contract = await getContractByKey("Voting", taskArguments.participant, hre);

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

    const tx = await contract.getVoteCandidates(
      taskArguments.voteid,
      {
        gasLimit: 500_000,
      }
    );
    console.log(tx);
  });

task("get-number-of-votes", "Get total number of created votes")
  .setAction(async function (taskArguments, hre) {
    const contract = await getContract("Voting", hre);

    const tx = await contract.getNumberOfVotes(
      {
        gasLimit: 500_000,
      }
    );
    console.log(tx);
  })

task("get-vote-participants", "Get participants of the vote")
  .addParam("voteid", "Index of Vote")
  .setAction(async function (taskArguments, hre) {
    const contract = await getContract("Voting", hre);

    const tx = await contract.getParticipants(
      taskArguments.voteid,
      {
        gasLimit: 500_000,
      }
    );
    console.log(tx);
  });

task("get-vote-endtime", "Get the ending time of the vote")
  .addParam("voteid", "Index of Vote")
  .setAction(async function (taskArguments, hre) {
    const contract = await getContract("Voting", hre);

    const tx = await contract.getVoteEndTime(
      taskArguments.voteid,
      {
        gasLimit: 500_000,
      }
    );
    console.log(tx);
  });

task("get-voted-candidate", "Get the candidate that the participant voted")
  .addParam("voteid", "Index of Vote")
  .addParam("participant", "The voted participant")
  .setAction(async function (taskArguments, hre) {
    const contract = await getContract("Voting", hre);

    const tx = await contract.getVotedCandidateByParticipant(
      taskArguments.voteid,
      taskArguments.participant,
      {
        gasLimit: 500_000,
      }
    );
    console.log(tx);
  });