// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdfundingPlatform is ReentrancyGuard, Ownable {
    struct Campaign {
        address creator;
        string title;
        string description;
        uint256 fundingGoal;
        uint256 currentFunding;
        uint256 deadline;
        bool isActive;
        string ipfsHash;
    }

    struct Milestone {
        uint256 campaignId;
        string title;
        string description;
        uint256 fundingAmount;
        bool isCompleted;
        uint256 votingDeadline;
        uint256 votesFor;
        uint256 votesAgainst;
        mapping(address => bool) hasVoted;
    }

    struct Contribution {
        address contributor;
        uint256 amount;
        uint256 timestamp;
        string referralCode;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Milestone[]) public campaignMilestones;
    mapping(uint256 => Contribution[]) public campaignContributions;
    mapping(address => uint256[]) public userCampaigns;
    mapping(address => uint256[]) public userContributions;
    mapping(string => address) public referralCodes;
    mapping(address => uint256) public referralEarnings;

    uint256 public nextCampaignId = 1;
    uint256 public platformFeePercent = 250; // 2.5%
    uint256 public referralRewardPercent = 500; // 5%

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 fundingGoal);
    event ContributionMade(uint256 indexed campaignId, address indexed contributor, uint256 amount, string referralCode);
    event MilestoneVoted(uint256 indexed campaignId, uint256 indexed milestoneId, address indexed voter, bool vote);
    event FundsReleased(uint256 indexed campaignId, uint256 indexed milestoneId, uint256 amount);
    event ReferralReward(address indexed referrer, address indexed referred, uint256 amount);

    constructor() {}

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _deadline,
        string memory _ipfsHash
    ) external returns (uint256) {
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        uint256 campaignId = nextCampaignId++;
        
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            title: _title,
            description: _description,
            fundingGoal: _fundingGoal,
            currentFunding: 0,
            deadline: _deadline,
            isActive: true,
            ipfsHash: _ipfsHash
        });

        userCampaigns[msg.sender].push(campaignId);

        emit CampaignCreated(campaignId, msg.sender, _title, _fundingGoal);
        return campaignId;
    }

    function contribute(uint256 _campaignId, string memory _referralCode) external payable nonReentrant {
        require(msg.value > 0, "Contribution must be greater than 0");
        require(campaigns[_campaignId].isActive, "Campaign is not active");
        require(block.timestamp < campaigns[_campaignId].deadline, "Campaign has ended");

        Campaign storage campaign = campaigns[_campaignId];
        campaign.currentFunding += msg.value;

        // Record contribution
        campaignContributions[_campaignId].push(Contribution({
            contributor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            referralCode: _referralCode
        }));

        userContributions[msg.sender].push(_campaignId);

        // Handle referral reward
        if (bytes(_referralCode).length > 0 && referralCodes[_referralCode] != address(0)) {
            address referrer = referralCodes[_referralCode];
            if (referrer != msg.sender) {
                uint256 referralReward = (msg.value * referralRewardPercent) / 10000;
                referralEarnings[referrer] += referralReward;
                
                // Transfer referral reward
                payable(referrer).transfer(referralReward);
                
                emit ReferralReward(referrer, msg.sender, referralReward);
            }
        }

        emit ContributionMade(_campaignId, msg.sender, msg.value, _referralCode);
    }

    function addMilestone(
        uint256 _campaignId,
        string memory _title,
        string memory _description,
        uint256 _fundingAmount,
        uint256 _votingDeadline
    ) external {
        require(campaigns[_campaignId].creator == msg.sender, "Only campaign creator can add milestones");
        require(_votingDeadline > block.timestamp, "Voting deadline must be in the future");

        campaignMilestones[_campaignId].push();
        uint256 milestoneIndex = campaignMilestones[_campaignId].length - 1;
        
        Milestone storage milestone = campaignMilestones[_campaignId][milestoneIndex];
        milestone.campaignId = _campaignId;
        milestone.title = _title;
        milestone.description = _description;
        milestone.fundingAmount = _fundingAmount;
        milestone.votingDeadline = _votingDeadline;
        milestone.isCompleted = false;
        milestone.votesFor = 0;
        milestone.votesAgainst = 0;
    }

    function voteOnMilestone(uint256 _campaignId, uint256 _milestoneIndex, bool _vote) external {
        require(_milestoneIndex < campaignMilestones[_campaignId].length, "Invalid milestone index");
        
        Milestone storage milestone = campaignMilestones[_campaignId][_milestoneIndex];
        require(block.timestamp < milestone.votingDeadline, "Voting period has ended");
        require(!milestone.hasVoted[msg.sender], "Already voted on this milestone");
        require(!milestone.isCompleted, "Milestone already completed");

        // Check if user has contributed to this campaign
        bool hasContributed = false;
        for (uint256 i = 0; i < userContributions[msg.sender].length; i++) {
            if (userContributions[msg.sender][i] == _campaignId) {
                hasContributed = true;
                break;
            }
        }
        require(hasContributed, "Only contributors can vote");

        milestone.hasVoted[msg.sender] = true;
        
        if (_vote) {
            milestone.votesFor++;
        } else {
            milestone.votesAgainst++;
        }

        emit MilestoneVoted(_campaignId, _milestoneIndex, msg.sender, _vote);
    }

    function releaseMilestoneFunds(uint256 _campaignId, uint256 _milestoneIndex) external {
        require(_milestoneIndex < campaignMilestones[_campaignId].length, "Invalid milestone index");
        
        Milestone storage milestone = campaignMilestones[_campaignId][_milestoneIndex];
        require(block.timestamp >= milestone.votingDeadline, "Voting period not ended");
        require(!milestone.isCompleted, "Milestone already completed");
        require(milestone.votesFor > milestone.votesAgainst, "Milestone not approved");

        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.currentFunding >= milestone.fundingAmount, "Insufficient funds");

        milestone.isCompleted = true;
        
        // Calculate platform fee
        uint256 platformFee = (milestone.fundingAmount * platformFeePercent) / 10000;
        uint256 creatorAmount = milestone.fundingAmount - platformFee;

        // Transfer funds
        payable(campaign.creator).transfer(creatorAmount);
        payable(owner()).transfer(platformFee);

        emit FundsReleased(_campaignId, _milestoneIndex, creatorAmount);
    }

    function setReferralCode(string memory _code) external {
        require(bytes(_code).length > 0, "Referral code cannot be empty");
        require(referralCodes[_code] == address(0), "Referral code already exists");
        
        referralCodes[_code] = msg.sender;
    }

    function withdrawReferralEarnings() external nonReentrant {
        uint256 earnings = referralEarnings[msg.sender];
        require(earnings > 0, "No earnings to withdraw");
        
        referralEarnings[msg.sender] = 0;
        payable(msg.sender).transfer(earnings);
    }

    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        return campaigns[_campaignId];
    }

    function getCampaignContributions(uint256 _campaignId) external view returns (Contribution[] memory) {
        return campaignContributions[_campaignId];
    }

    function getUserCampaigns(address _user) external view returns (uint256[] memory) {
        return userCampaigns[_user];
    }

    function getUserContributions(address _user) external view returns (uint256[] memory) {
        return userContributions[_user];
    }

    function getMilestoneCount(uint256 _campaignId) external view returns (uint256) {
        return campaignMilestones[_campaignId].length;
    }
}