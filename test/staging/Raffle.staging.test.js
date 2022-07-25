/*
 * Para correr esta prueba debo seguir estos pasos:
 * 1. Obtener unaSubId para el ChainlinkVRF en https://vrf.chain.link
 * 2. Hacer deploy al contrato usando la SubId
 * 3. Registrar el contrato en ChainlinkVRF y su SubId
 * 4. Registrar el contrato en Chainlink Keepers en https://keepers.chain.link/
 * 5. Correr las pruebas
 */
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle unit tests", function () {
          let raffle, deployer, entranceFee

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              entranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords function", function () {
              it("Works with live Chainlink Keepers and Chainlink VRF", async function () {
                  console.log("Setting up test...")
                  const startingTimeStamp = await raffle.getLatestTimestamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up listener...")
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPcked event fired!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimestamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert(endingTimeStamp > startingTimeStamp)
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(entranceFee).toString()
                              )

                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      // Entro a la loteria despues de acomodar el listener por si acaso la
                      // blockchain se mueve muy rapido
                      console.log("Entering the raffle")
                      const transactionResponse = await raffle.enterRaffle({ value: entranceFee })
                      await transactionResponse.wait(1)
                      console.log("Waiting...")
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
