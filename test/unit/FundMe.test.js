const {assert, expect} = require("chai")
const {deployments, ethers, getNamedAccounts} = require("hardhat")

describe("FundMe", async function () {
    let fundMe
    let deployer
    let MockV3Aggregator
    const sendValue = ethers.utils.parseEther("1") //1ETH equivalent if hardcoded 1000000000000000000
    beforeEach(async function () {
        //deploy fundME contract
        //using hardhat-deploy
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        MockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })
    describe("constructor", async function () {
        it("sets agregator  address correctly", async function () {
            const response = await fundMe.s_priceFeed()
            assert.equal(response, MockV3Aggregator.address)
        })
    })
    describe("fundRaising", async function () {
        it("fails if not enough ETH sends", async function () {
            await expect(fundMe.fundRaising()).to.be.revertedWith(
                "the amount is not enough..."
            )
        })
        it("add s_funders to a list of s_funders", async function () {
            await fundMe.fundRaising({value: sendValue})
            const funder = await fundMe.s_funders(0)
            assert.equal(funder, deployer)
        })
        it("mapped funder amount with address ", async function () {
            await fundMe.fundRaising({value: sendValue})
            const response = await fundMe.s_funderAmount(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
    })
    describe("withdraw", async function () {
        beforeEach(async function () {
            await fundMe.fundRaising({value: sendValue})
        })
        it("withdraw ETH while single funder address", async function () {
            //Act
            const startingBalanceFundmeAdress =
                await ethers.provider.getBalance(fundMe.address)
            const startingBalanceDeployer = await ethers.provider.getBalance(
                deployer
            )
            //Arrange
            const transactionResponse = await fundMe.withdrawal()
            const transactionReceive = await transactionResponse.wait(1)
            const {gasUsed, effectiveGasPrice} = transactionReceive
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingBalanceFAddress = await ethers.provider.getBalance(
                fundMe.address
            )
            const endingBalanceDeployer = await ethers.provider.getBalance(
                deployer
            )
            //assert
            assert.equal(endingBalanceFAddress, 0)
            assert.equal(
                startingBalanceFundmeAdress
                    .add(startingBalanceDeployer)
                    .toString(),
                endingBalanceDeployer.add(gasCost).toString()
            )
        })
        it("withdraw ETH from fundMe address while multiple s_funders", async function () {
            //Act
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundConnectContract = await fundMe.connect(accounts[i])
                await fundConnectContract.fundRaising({value: sendValue})
            }
            const startingBalanceFundmeAdress =
                await ethers.provider.getBalance(fundMe.address)
            const startingBalanceDeployer = await ethers.provider.getBalance(
                deployer
            )
            //Arrange
            const transactionResponse = await fundMe.withdrawal()
            const transactionReceive = await transactionResponse.wait(1)
            const {gasUsed, effectiveGasPrice} = transactionReceive
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingBalanceFAddress = await ethers.provider.getBalance(
                fundMe.address
            )
            const endingBalanceDeployer = await ethers.provider.getBalance(
                deployer
            )
            //assert
            assert.equal(endingBalanceFAddress, 0)
            assert.equal(
                startingBalanceFundmeAdress
                    .add(startingBalanceDeployer)
                    .toString(),
                endingBalanceDeployer.add(gasCost).toString()
            )

            //s_funders are set to zero
            await expect(fundMe.s_funders(0)).to.be.reverted
            for (i = 1; i < 6; i++) {
                assert.equal(await fundMe.s_funderAmount(accounts[i].address), 0)
            }
        })
        it("only allows the owner to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const fundConnectContract = await fundMe.connect(accounts[1])
            await expect(fundConnectContract.withdrawal()).to.be.reverted
        })
        it("withdraw using cheaperwithdraw ETH from fundMe address while multiple s_funders", async function () {
            //Act
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundConnectContract = await fundMe.connect(accounts[i])
                await fundConnectContract.fundRaising({value: sendValue})
            }
            const startingBalanceFundmeAdress =
                await ethers.provider.getBalance(fundMe.address)
            const startingBalanceDeployer = await ethers.provider.getBalance(
                deployer
            )
            //Arrange
            const transactionResponse = await fundMe.cheaperWithdrawal()
            const transactionReceive = await transactionResponse.wait(1)
            const {gasUsed, effectiveGasPrice} = transactionReceive
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingBalanceFAddress = await ethers.provider.getBalance(
                fundMe.address
            )
            const endingBalanceDeployer = await ethers.provider.getBalance(
                deployer
            )
            //assert
            assert.equal(endingBalanceFAddress, 0)
            assert.equal(
                startingBalanceFundmeAdress
                    .add(startingBalanceDeployer)
                    .toString(),
                endingBalanceDeployer.add(gasCost).toString()
            )

            //s_funders are set to zero
            await expect(fundMe.s_funders(0)).to.be.reverted
            for (i = 1; i < 6; i++) {
                assert.equal(await fundMe.s_funderAmount(accounts[i].address), 0)
            }
        })
    })
})
