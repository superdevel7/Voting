// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
// import "@openzeppelin/contracts/security/PullPayment.sol";

contract Voting is Ownable {
  uint256 private votePrice = 0.01 ether;
  uint256 private voteDuration = 3 * 24 * 60 * 60; // 3 days
  uint256 private feePercent = 10;  // 10%
  uint256 private commission = 0;

  using Counters for Counters.Counter;
  Counters.Counter private currentVoteId;

  struct VoteInfo {
    address[] candidates;
    uint256 endTime;
    bool isClosed;
    mapping(address => uint256) numElections;
    mapping(address => bool) isCandidate;
    mapping(address => bool) isVoted;
    mapping(address => address) votedCandidateByParticipant;
    address[] participants;
    address winner;
  }

  mapping(uint256 => VoteInfo) votes;

  event VotingCreated(uint256 voteId, address[] candidates);
  event VoteParticipated(uint256 voteId, address candidate);
  event VoteWinner(uint256 voteId, address winner);
  event WithdrawCommission(address payee, uint256 amount);

  function getVoteCandidates(uint256 voteId)
    public
    view
    returns (address[] memory)
  {
    require(voteId < currentVoteId.current(), "Invalid vote id");
    return votes[voteId].candidates;
  }

  function getNumberOfVotes()
    public
    view
    returns (uint256)
  {
    return currentVoteId.current();
  }

  function getParticipants(uint256 voteId)
    public
    view
    returns (address[] memory)
  {
    require(voteId < currentVoteId.current(), "Invalid vote id");
    return votes[voteId].participants;
  }

  function getVotedCandidateByParticipant(uint256 voteId, address participant)
    public
    view
    returns (address)
  {
    require(voteId < currentVoteId.current(), "Invalid vote id");
    require(votes[voteId].isVoted[participant], "This participant did not vote yet.");
    return votes[voteId].votedCandidateByParticipant[participant];
  }

  function getCurrentCommission()
    public
    view
    returns (uint256)
  {
    return commission;
  }

  function getWinner(uint256 voteId)
    public
    view
    returns (address)
  {
    require(voteId < currentVoteId.current(), "Invalid vote id");
    require(votes[voteId].isClosed, "Voting process is not closed");
    return votes[voteId].winner;
  }

  function createVoting(address[] memory candidates)
    public
    onlyOwner
  {
    uint256 voteId = currentVoteId.current();
    uint256 candidateNum = candidates.length;
    require(candidateNum > 0, "There must be at least one candidate");
    for (uint256 i = 0; i < candidateNum; i ++) {
      require(candidates[i] != address(0), "Zero address cannot be candidate");
      require(!votes[voteId].isCandidate[candidates[i]], "Duplicate candidate");
      votes[voteId].isCandidate[candidates[i]] = true;
    }

    votes[voteId].candidates = candidates;
    votes[voteId].endTime = block.timestamp + voteDuration;

    currentVoteId.increment();

    emit VotingCreated(voteId, candidates);
  }

  function participateVote(uint256 voteId, address candidate)
    public
    payable
  {
    //
    require(msg.value >= votePrice, "Insufficient ether");
    require(voteId < currentVoteId.current(), "Invalid vote id");
    require(!votes[voteId].isClosed, "Voting process is closed");
    require(votes[voteId].isCandidate[candidate], "Invalid candidate");
    require(!votes[voteId].isVoted[msg.sender], "Already voted");

    votes[voteId].isVoted[msg.sender] = true;
    votes[voteId].numElections[candidate] += 1;
    votes[voteId].participants.push(msg.sender);
    votes[voteId].votedCandidateByParticipant[msg.sender] = candidate;

    emit VoteParticipated(voteId, candidate);
  }

  function endVoting(uint256 voteId)
    public
  {
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
    uint256 currentCommission = amount * feePercent / 100;
    amount -= currentCommission;

    (bool success, ) = winner.call{ value: amount }("");
    require(success, "Failed to send winner prize");

    commission += currentCommission;
    votes[voteId].winner = winner;

    emit VoteWinner(voteId, winner);
  }

  function withdrawCommission(address payable payee)
    public
    onlyOwner
  {
    uint256 amount = commission;
    payee.transfer(amount);
    commission = 0;

    emit WithdrawCommission(payee, amount);
  }
}
