const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle unit tests", function () {
          let raffle,
              vrfCoordinatorV2Mock,
              deployer,
              entranceFee,
              gasLane,
              callBackGasLimit,
              interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture("all")
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              entranceFee = await raffle.getEntranceFee()
              gasLane = await raffle.getGasLane()
              callBackGasLimit = await raffle.getCallBackGasLimit()
              interval = await raffle.getInterval()
          })

          describe("Constructor and deploymet", function () {
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

              it("Sets a new player array", async function () {
                  const numPlayers = await raffle.getNumberOfPlayers()
                  assert.equal(numPlayers.toString(), "0")
              })

              it("Sets the number of random numbers to one", async function () {
                  const numWords = await raffle.getNumWords()
                  assert.equal(numWords.toString(), "1")
              })

              it("Sets the number of request to three", async function () {
                  const numConfirmations = await raffle.getRequestConfirmations()
                  assert.equal(numConfirmations.toString(), "3")
              })
          })

          describe("enterRaffle function", function () {
              it("Reverts when the player does not pay enough", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__NotEnoughETHEntered"
                  )
              })

              it("Record the player when they enter", async function () {
                  await raffle.enterRaffle({ value: entranceFee })
                  const contractPlayer = await raffle.getPlayer(0)

                  assert.equal(contractPlayer, deployer)
              })

              it("Emits the event when a player has enter the raffle", async function () {
                  await expect(raffle.enterRaffle({ value: entranceFee }))
                      .to.emit(raffle, "RaffleEnter")
                      .withArgs(deployer)
              })

              it("Does not allow to enter the raffle when calculating", async function () {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep([])
                  await expect(raffle.enterRaffle({ value: entranceFee })).to.be.revertedWith(
                      "Raffle__NotOpen"
                  )
              })
          })

          describe("checkUpkeep function", function () {
              it("Returns false if the raffle is not open", async function () {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep([])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert.equal(upkeepNeeded, false)
              })

              it("Returns false if enough time has not passed", async function () {
                  await raffle.enterRaffle({ value: entranceFee })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert.equal(upkeepNeeded, false)
              })

              it("Returns false if there is no balance, and no players", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })

              it("Returns true if the conditions passes", async function () {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert.equal(upkeepNeeded, true)
              })
          })

          describe("performUpkeep function", function () {
              it("Can only run if checkUpkeep is true", async function () {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const tx = await raffle.performUpkeep([])
                  assert(tx)
              })

              it("Should revert if checkUpkeep is false", async function () {
                  await expect(raffle.performUpkeep([])).to.be.revertedWith(
                      "Raffle__UpkeepNoNeeded"
                  )
              })

              it("Update the raffle state, emit the event and requestId", async function () {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const txResponse = await raffle.performUpkeep([])
                  const txReceipt = await txResponse.wait(1)
                  const requestId = txReceipt.events[1].args.requestId
                  const raffleState = await raffle.getRaffleState()
                  assert(requestId.toNumber() > 0)
                  assert(raffleState == 1)
              })
          })

          describe("fulfillRandomWords function", function () {
              beforeEach(async function () {
                  await raffle.enterRaffle({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
              })

              it("Should only be called after performUpKeep", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
              })

              it("Should pick a winner, reset the array and send the money", async function () {
                  const accounts = await ethers.getSigners()
                  const startingTimeStamp = await raffle.getLatestTimestamp()
                  const players = 4
                  const startingAccountIndex = 1
                  for (let i = startingAccountIndex; i < startingAccountIndex + players; i++) {
                      const rafflePlayer = raffle.connect(accounts[i])
                      await rafflePlayer.enterRaffle({ value: entranceFee })
                  }
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("Found the event")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const winnerEndingingBalance = await accounts[1].getBalance()
                              console.log(`The recent winner is: ${recentWinner}`)
                              console.log(`Account 0: ${accounts[0].address}`)
                              console.log(`Account 1: ${accounts[1].address}`)
                              console.log(`Account 2: ${accounts[2].address}`)
                              console.log(`Account 3: ${accounts[3].address}`)
                              console.log(`Account 4: ${accounts[4].address}`)
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp = await raffle.getLatestTimestamp()
                              assert.equal(raffleState, 0)
                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert(endingTimeStamp > startingTimeStamp)
                              assert.equal(
                                  winnerEndingingBalance.toString(),
                                  winnerStartingBalance
                                      .add(entranceFee.mul(players).add(entranceFee))
                                      .toString()
                              )
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })

                      const winnerStartingBalance = await accounts[1].getBalance()
                      const tx = await raffle.performUpkeep([])
                      const txReceipt = await tx.wait(1)
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          raffle.address
                      )
                  })
              })
          })
      })
