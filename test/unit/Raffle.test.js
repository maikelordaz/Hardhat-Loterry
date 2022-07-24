const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle unit tests", async function () {
          let raffle, vrfCoordinatorV2Mock, entranceFee, gasLane, callBackGasLimit, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              const { deployer } = await getNamedAccounts()
              await deployments.fixture("all")
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              entranceFee = await raffle.getEntranceFee()
              gasLane = await raffle.getGasLane()
              callBackGasLimit = await raffle.getCallBackGasLimit()
              interval = await raffle.getInterval()
          })

          describe("Constructor", async function () {
              it("Sets the raffle with the correct entranceFee", async function () {
                  const actualEntranceFee = entranceFee.toString()
                  const expectedEntranceFee = networkConfig[chainId]["entranceFee"]

                  assert.equal(actualEntranceFee, expectedEntranceFee)
              })

              it("Sets the raffle with the correct gasLane", async function () {
                  const expectedGasLane = networkConfig[chainId]["gasLane"]

                  assert.equal(gasLane, expectedGasLane)
              })

              it("Sets the raffle with the correct callBackGasLimit", async function () {
                  const actualCallBackGasLimit = callBackGasLimit.toString()
                  const expectedCallBackGasLimit = networkConfig[chainId]["callbackGasLimit"]

                  assert.equal(actualCallBackGasLimit, expectedCallBackGasLimit)
              })

              it("Initialize the raffle at the correct state", async function () {
                  const raffleState = await raffle.getRaffleState()
                  const actualRaffleState = raffleState.toString()
                  const expectedRaffleState = "0"

                  assert.equal(actualRaffleState, expectedRaffleState)
              })

              it("Sets the raffle with the correct interval", async function () {
                  const actualInterval = interval.toString()
                  const expectedInterval = networkConfig[chainId]["interval"]

                  assert.equal(actualInterval, expectedInterval)
              })
          })

          describe("enterRaffle", async function () {
              it("", async function () {})
          })
      })
