require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {

    const usdcAddress = process.env.VITE_ARC_USDC_ADDRESS;

    const Escrow = await ethers.getContractFactory("Escrow");

    console.log("Deploying Escrow...");

    const escrow = await Escrow.deploy(usdcAddress);

    await escrow.waitForDeployment();

    console.log("Escrow deployed successfully!");
    console.log("Contract Address:", await escrow.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
