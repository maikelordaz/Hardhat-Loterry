# Raffle

This is a solidity project to show how to use Chainlink VRF and
Chainlink Keepers. It consist on a descentralized and auromated
lottery

## :rocket: INSTALLATION

1. Clone this repo
2. Install the dependencies with 
    > npm install
    > yarn install


## :computer: WALKTHROUGH

To fund Chainlink VRF subscription enter [here](https://vrf.chain.link/)
To fund Chainlink Keeper enter [here](https://keepers.chain.link/)
  
## :floppy_disk: TECNOLOGIES

+ Chainlink
    - Chainlink VRF V2
    - Chainlink Keepers
+ Hardhat

## :abacus: TEST

The tests are divided to check every contract functionality one by one.
For the Unit test run any of this:

    > npx hardhat test
    > npm run test
    > yarn hardhat test
    > yarn test

For the staging test remember to deploy first, and fund your VRF and Keepers
subscription. For the deploy run any of this comands 

    > yarn hardhat deploy --network rinkeby
    > yarn rinkeby

Wait for the deploy and verification, and then run either of this ones
    > yarn hardhat test --network rinkeby
    > yarn staging

## :bookmark_tabs: CONTRIBUTE

If you want to contribute just fork the repo and describe the changes you made.

## :balance_scale: LICENSE

MIT
