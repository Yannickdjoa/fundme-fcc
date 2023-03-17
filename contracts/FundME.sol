// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
//new convention is to add the name of the contract before the error name
//like that it makes it easy to know from where the error is
//FundMe_NotOwner indeed of just NotOwner
error FundMe__NotOwner();

//contract to raise funds for a project
//see below an example of NatSpec
/**
 * @title fundMe crowdfounding project
 * @author Yannick
 * @notice simple contract to allow contributors can fund the project for a minimum predefined Usd
 * @dev this implements a library as s_priceFeed
 */
contract FundMe {
    using PriceConverter for uint256;
    uint256 public constant MINIMUM_USD = 10 * 1e18;
    address[] private s_funders;
    mapping(address => uint) public s_funderAmount;
    address private immutable i_owner;
    AggregatorV3Interface internal s_priceFeed;

    constructor(address priceFeedAddress) {
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
        i_owner = msg.sender;
    }

    //  1. where people can fund the project 2. to enable the project to raise funds.
    function fundRaising() public payable {
        //set a minimum amount to fund
        require(
            msg.value.convertedPriceRate(s_priceFeed) >= MINIMUM_USD,
            "the amount is not enough..."
        );

        //list of s_funders
        s_funders.push(msg.sender);

        //map s_funders with amount funded
        s_funderAmount[msg.sender] += msg.value;
    }

    modifier onlyOwner() {
        //only owner can withdraw
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    function withdrawal() public onlyOwner {
        //possibility to withdraw funds
        //3 variables allow to withdraw money call, send transfer. we will use the call variable
        (bool tokenWithdrawn, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(tokenWithdrawn, "You are not the contract Owner...");

        //set s_funders amount to zero once withdrawal done
        for (uint256 i = 0; i < s_funders.length; i++) {
            address funder = s_funders[i];
            s_funderAmount[funder] = 0;
        }
        s_funders = new address[](0);
    }
    function cheaperWithdrawal() public onlyOwner {
        //set s_funders amount to zero once withdrawal done
        address[] memory funders= s_funders;
        for (uint256 fundersIndex = 0; fundersIndex < funders.length; fundersIndex++) {
            address funder = funders[fundersIndex];
            s_funderAmount[funder] = 0;
        }
        s_funders = new address[](0);
        //possibility to withdraw funds
        //3 variables allow to withdraw money call, send transfer. we will use the call variable
        (bool tokenWithdrawn, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(tokenWithdrawn, "You are not the contract Owner...");

        
    }
}
