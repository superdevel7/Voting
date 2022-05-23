// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/PullPayment.sol";

contract Voting is Ownable, PullPayment {
  uint256 private votePrice = 0.01 ether;
  uint256 private voteDuration = 3 * 24 * 60 * 60; // 3 days

  using Counters for Counters.Counter;
  Counters.Counter private currentVoteId;

  struct VoteInfo {
    address[] candidates;
    uint256 endTime;
    bool isClosed;
    mapping(address => uint256) numElections;
    mapping(address => bool) isCandidate;
    mapping(address => bool) isVoted;
  }

  mapping(uint256 => VoteInfo) votes;

  event VotingCreated(uint256 voteId, address[] candidates);
  event VoteParticipated(uint256 voteId, address candidate);
  event VoteWinner(uint256 voteId, address winner);

  function getVoteCandidates(uint256 voteId)
    public
    view
    returns (address[] memory)
  {
    require(voteId < currentVoteId.current(), "Invalid vote id");
    return votes[voteId].candidates;
  }

  function getNumberOfVotes() public view returns (uint256) {
    return currentVoteId.current();
  }

  function getVoteEndTime(uint256 voteId) public view returns (uint256) {
    require(voteId < currentVoteId.current(), "Invalid vote id");
    return votes[voteId].endTime;
  }

  function createVoting(address[] memory candidates) public onlyOwner {
    uint256 voteId = currentVoteId.current();

    votes[voteId].candidates = candidates;
    votes[voteId].endTime = block.timestamp + voteDuration;

    for (uint256 i = 0; i < candidates.length; i++) {
      votes[voteId].isCandidate[candidates[i]] = true;
    }

    currentVoteId.increment();

    emit VotingCreated(voteId, candidates);
  }

  function participateVote(uint256 voteId, address candidate) public payable {
    //
    require(msg.value >= votePrice, "Insufficient ether");
    require(voteId < currentVoteId.current(), "Invalid vote id");
    require(!votes[voteId].isClosed, "Voting process is closed");
    require(votes[voteId].isCandidate[candidate], "Invalid candidate");
    require(!votes[voteId].isVoted[msg.sender], "Already voted");

    votes[voteId].isVoted[msg.sender] = true;
    votes[voteId].numElections[candidate] += 1;

    emit VoteParticipated(voteId, candidate);
  }

  function endVoting(uint256 voteId) public {
    require(voteId < currentVoteId.current(), "Invalid vote id");
    require(!votes[voteId].isClosed, "Already closed");
    require(
      block.timestamp >= votes[voteId].endTime,
      "You can close voting after 3 days"
    );

    //
    address winner = votes[voteId].candidates[0];
    uint256 totalVotes = 0;
    uint256 winnerElections = votes[voteId].numElections[winner];

    for (uint256 i = 0; i < votes[voteId].candidates.length; i++) {
      address candidate = votes[voteId].candidates[i];
      uint256 elections = votes[voteId].numElections[candidate];
      if (elections > winnerElections) {
        winner = candidate;
        winnerElections = elections;
      }
      totalVotes += elections;
    }

    //
    votes[voteId].isClosed = true;
    uint256 amount = totalVotes * votePrice;
    amount -= amount / 10;

    (bool success, ) = winner.call{ value: amount }("");
    require(success, "Failed to send winner prize");

    emit VoteWinner(voteId, winner);
  }

  // @dev Overriden in order to make it onlyOwner function
  function withdrawPayments(address payable payee)
    public
    virtual
    override
    onlyOwner
  {
    super.withdrawPayments(payee);
  }
}
