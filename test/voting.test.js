const { deployContract } = require('./helpers.js');
const { expect } = require("chai");
const { constants } = require("@openzeppelin/test-helpers");
const { ethers } = require('hardhat');
const { ZERO_ADDRESS } = constants;

const createTestSuite = ({ contract, constructorArgs }) =>
  function () {
    context(`${contract}`, function () {
      beforeEach(async function () {
        this.voting = await deployContract(contract, constructorArgs);
      });

      context("with no created votes", async function () {
        it("has 0 votes", async function () {
          const numberOfVotes = await this.voting.getNumberOfVotes();
          expect(numberOfVotes).to.equal(0);
        });
      });

      context("with created votes", async function () {
        beforeEach(async function() {
          const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
          this.owner = owner;
          this.addr1 = addr1;
          this.addr2 = addr2;
          this.addr3 = addr3;
          this.addr4 = addr4;
          this.addr5 = addr5;
          this.createVoteTx = await this.voting.createVoting([this.addr1.address, this.addr2.address]);
        });

        describe("check status", async function() {
          it("create vote event", async function() {
            await expect(this.createVoteTx)
              .to.emit(this.voting, "VotingCreated")
              .withArgs(0, [this.addr1.address, this.addr2.address]);
          });

          it("has 1 votes", async function() {
            const numberOfVotes = await this.voting.getNumberOfVotes();
            expect(numberOfVotes).to.equal(1);
          });

          it("vote0 candidates: addr1, addr2", async function() {
            const candidates = await this.voting.getVoteCandidates(0);
            expect(candidates).to.equal([this.addr1.address, this.addr2.address]);
          });
        });

        context("participating vote", async function() {
          beforeEach(async function() {
            this.participateVoteTx1 = await this.voting.connect(this.addr3).participateVote(0, this.addr1.address);
            this.participateVoteTx2 = await this.voting.connect(this.addr4).participateVote(0, this.addr2.address);
            this.participateVoteTx3 = await this.voting.connect(this.addr5).participateVote(0, this.addr1.address);
          });

          it("participate vote event", async function() {
            await expect(this.participateVoteTx1)
              .to.emit(this.voting, "VoteParticipated")
              .withArgs(0, this.addr1.address);

            await expect(this.participateVoteTx2)
              .to.emit(this.voting, "VoteParticipated")
              .withArgs(0, this.addr2.address);

            await expect(this.participateVoteTx3)
              .to.emit(this.voting, "VoteParticipated")
              .withArgs(0, this.addr1.address);
          });

          context("end vote", async function() {
            beforeEach(async function() {
              this.endVoteTx = await this.voting.connect(this.addr3).endVoting(0);
            });

            it("end vote event", async function() {
              await expect(this.endVoteTx)
                .to.emit(this.voting, "VoteWinner")
                .withArgs(0, this.addr1.address);
            });
          });
        });
      });
    });
  };

describe(
  "Voting",
  createTestSuite({
    contract: "Voting",
    constructorArgs: [],
  })
);
