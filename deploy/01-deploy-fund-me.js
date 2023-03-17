const {networkConfig} = require("../helper-hardhat-config.js")
const {network} = require("hardhat")
const {verify} = require("../utils/verify")
//above syntax is the same as commented syntax below
//const helperConfig= require("../helper-hardhat-config.js")
//const networkConfig= helperConfig.networkConfig

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    //indicating to the deploy system
    //if chainId is X use pricefeed address Y
    //if chainId is Z use pricefeed address B
    let ethUsdPriceFeedAddress
    if (chainId == 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    log("---------------------------------")
    //deployment variable
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`FundMe deployed at ${fundMe.address}`)

    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, args)
    }
}

module.exports.tags = ["all", "fundMe"]
