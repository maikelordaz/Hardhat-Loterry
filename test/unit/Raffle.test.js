const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

/*
 * Los describe no pueden manejar async asi que no importa si se ponen o no
 * En este caso se quitaran para que se vea mas estetico
 * los it y los beforEach si deben tener el async
 */
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

          describe("Constructor", function () {
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
                  // Los siguientes metodos los tomo de https://hardhat.org/hardhat-network/reference
                  // Primero adelanto el tiempo con "evm_increasetime"
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  // Luego de adelantar el tiempo mino un bloque con "evm_mine"
                  // Tambien puede ser await network.provider.request({ method: "evm_mine", params: [] })
                  await network.provider.send("evm_mine", [])
                  // Simulo ser un keeper para cambiar el estado de la loteria
                  // El argumento esta vacio porque no lo necesito: ver el codigo
                  // La otra forma de dar un argumento vacio es await raffle.performUpkeep("0x")
                  await raffle.performUpkeep([])
                  await expect(raffle.enterRaffle({ value: entranceFee })).to.be.revertedWith(
                      "Raffle__NotOpen"
                  )
              })
          })

          describe("checkUpkeep function", async function () {
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
                  // Con callStatic simulo una transaccion sin enviarla
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  // Tambien puede ser assert.equal(upkeepNeeded, false)
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
      })
