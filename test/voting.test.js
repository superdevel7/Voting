const { deployContract } = require('./helpers.js');
const { expect } = require("chai");
const { constants } = require("@openzeppelin/test-helpers");
const { ethers } = require('hardhat');
const { ZERO_ADDRESS } = constants;

const createTestSuite = ({ contract, constructorArgs }) =>
  function () {
    context(`${contract}`, function () {
      beforeEach(async function () {
        const [owner, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();
        this.owner = owner;
        this.addr1 = addr1;
        this.addr2 = addr2;
        this.addr3 = addr3;
        this.addr4 = addr4;
        this.addr5 = addr5;
        this.addr6 = addr6;
        this.voting = await deployContract(contract, constructorArgs);
      });

      describe("with no created votes", async function () {
        it("has 0 votes", async function () {
          const numberOfVotes = await this.voting.getNumberOfVotes();
          expect(numberOfVotes).to.equal(0);
        });
      });

      describe("revert creating vote test", async function() {
        it("empty candidate error", async function() {
          await expect(
            this.voting.createVoting([])
          ).to.be.revertedWith("There must be at least one candidate");
        });

        it("zero address error", async function() {
          await expect(
            this.voting.createVoting([this.addr1.address, ZERO_ADDRESS])
          ).to.be.revertedWith("Zero address cannot be candidate");
        });

        it("duplicate error", async function() {
          await expect(
            this.voting.createVoting([this.addr1.address, this.addr2.address, this.addr1.address])
          ).to.be.revertedWith("Duplicate candidate");
        });
      });

      context("with created votes", async function () {
        beforeEach(async function() {
          this.createVoteTx = await this.voting.createVoting([this.addr1.address, this.addr2.address]);
        });

        describe("check status", async function() {
          it("create vote event", async function() {
            await expect(this.createVoteTx)
              .to.emit(this.voting, "VotingCreated")
              .withArgs(0, [this.addr1.address, this.addr2.address]);
          });

          it("has 1 vote", async function() {
            const numberOfVotes = await this.voting.getNumberOfVotes();
            expect(numberOfVotes).to.equal(1);
          });

          it("vote0 candidates: addr1, addr2", async function() {
            const candidates = await this.voting.getVoteCandidates(0);
            expect(candidates).to.deep.equal([this.addr1.address, this.addr2.address]);
          });
        });

        context("participating vote", async function() {
          beforeEach(async function() {

            var exp = ethers.BigNumber.from("10").pow(15);
            const ethValue = ethers.BigNumber.from("10").mul(exp); // 0.01 ether

            this.participateVoteTx1 = await this.voting.connect(this.addr3).participateVote(0, this.addr1.address, { value: ethValue });
            this.participateVoteTx2 = await this.voting.connect(this.addr4).participateVote(0, this.addr2.address, { value: ethValue });
            this.participateVoteTx3 = await this.voting.connect(this.addr5).participateVote(0, this.addr1.address, { value: ethValue });
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

          describe("revert test", async function() {
            it("insufficient ether", async function() {
              var exp = ethers.BigNumber.from("10").pow(15);
              const ethValue = ethers.BigNumber.from("5").mul(exp); // 0.005 ether
              await expect(
                this.voting.connect(this.addr3).participateVote(0, this.addr1.address, { value: ethValue })
              ).to.be.revertedWith("Insufficient ether");
            });

            it("Invalid vote id", async function() {
              var exp = ethers.BigNumber.from("10").pow(15);
              const ethValue = ethers.BigNumber.from("10").mul(exp); // 0.01 ether
              await expect(
                this.voting.connect(this.addr3).participateVote(1, this.addr1.address, { value: ethValue })
              ).to.be.revertedWith("Invalid vote id");
            });

            it("Invalid candidate", async function() {
              var exp = ethers.BigNumber.from("10").pow(15);
              const ethValue = ethers.BigNumber.from("10").mul(exp); // 0.01 ether
              await expect(
                this.voting.connect(this.addr3).participateVote(0, this.addr4.address, { value: ethValue })
              ).to.be.revertedWith("Invalid candidate");
            });

            it("Already voted", async function() {
              var exp = ethers.BigNumber.from("10").pow(15);
              const ethValue = ethers.BigNumber.from("10").mul(exp); // 0.01 ether
              await expect(
                this.voting.connect(this.addr3).participateVote(0, this.addr1.address, { value: ethValue })
              ).to.be.revertedWith("Already voted");
            });
          });

          it("vote0 participants: addr3, addr4, addr5", async function() {
            const participants = await this.voting.getParticipants(0);
            expect(participants).to.deep.equal([this.addr3.address, this.addr4.address, this.addr5.address]);
          });

          it("end vote revert test", async function() {
            await expect(
              this.voting.connect(this.addr3).endVoting(0)
            ).to.be.revertedWith("You can close voting after 3 days");
          });

          it("commission test", async function() {
            const currentCommission = await this.voting.getCurrentCommission();
            expect(currentCommission).to.equal(0);
          });

          context("end vote", async function() {
            beforeEach(async function() {
              ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]); // 3 days increase
              ethers.provider.send("evm_mine");
              this.endVoteTx = await this.voting.connect(this.addr3).endVoting(0);
            });
  
            it("end vote event", async function() {
              await expect(this.endVoteTx)
                .to.emit(this.voting, "VoteWinner")
                .withArgs(0, this.addr1.address);
            });
  
            it("winner test", async function() {
              const winner = await this.voting.getWinner(0);
              expect(winner).to.equal(this.addr1.address);
            });
  
            it("commission test", async function() {
              var exp = ethers.BigNumber.from("10").pow(15);
              const ethValue = ethers.BigNumber.from("10").mul(exp); // 0.01 ether
              const expectedTotalAmount = ethers.BigNumber.from("3").mul(ethValue); // 0.03 ether
              const expectedCommission = expectedTotalAmount.div(10); // 10 %
              const currentCommission = await this.voting.getCurrentCommission();
              expect(currentCommission).to.equal(expectedCommission);
            });

            context("withdraw commission", async function() {
              beforeEach(async function() {
                this.withdrawCommissionTx = await this.voting.withdrawCommission(this.addr6.address);
              });
    
              it("withdraw commission event", async function() {
                var exp = ethers.BigNumber.from("10").pow(15);
                const expectedCommission = ethers.BigNumber.from("3").mul(exp); // 0.003 ether
                await expect(this.withdrawCommissionTx)
                  .to.emit(this.voting, "WithdrawCommission")
                  .withArgs(this.addr6.address, expectedCommission);
              });
            });
          });
        });
      });
    });
  };

describe(
  "Voting Test",
  createTestSuite({
    contract: "Voting",
    constructorArgs: [],
  })
);
