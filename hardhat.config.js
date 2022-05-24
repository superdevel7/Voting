/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");

require("dotenv").config();

if (process.env.REPORT_COVERAGE) {
  require("solidity-coverage");
}

require("./scripts");
require("./tasks");

module.exports = {
  solidity: "0.8.4",
};
