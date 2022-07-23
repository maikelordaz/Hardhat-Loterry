// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

/* IMPORTS */

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

/* ERRORS */

error Raffle__NotEnoughETHEntered();
error Raffle__TransferFailed();

contract Raffle is VRFConsumerBaseV2 {
    /* STATE VARIABLES */

    uint256 private immutable i_entranceFee; // recuerda que las immutables ahorran gas
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane; // este es el keyHash de la documentacion
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callBackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery variables //

    address private s_recentWinner;

    /* EVENTS */
    // Una buena practica para nombrar eventos es voltear el nombre de la funcion en que se emite
    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callBackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callBackGasLimit = callBackGasLimit;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughETHEntered();
        }
        s_players.push(payable(msg.sender)); // msg.sender por si solo no es payable, tengo q especificarlo
        emit RaffleEnter(msg.sender);
    }

    // Las funciones external son mas baratas que las public porque nuestro contrato no las puede llamar
    function requestRandomWinner() external {
        uint256 requesId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, // maximo gas que estoy dispuesto a pagar
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callBackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requesId);
    }

    /*
     * Con la funcion anterior pido los numeros al azar y esta los obtinene, es override
     * Las funciones a las que se les hace override, en su contrato original son virtual
     * Comento requestId porque no la uso, pero debo dejar el uint256 porque lo necesito para
     * la funcion
     */
    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        /*
         * Se hace randomWords[0] porque solo estoy pidiendo un numero al azar, que lo estableci
         * con la variable NUM_WORDS, de ser mas cambio ese indice. En este caso es uno solo
         * porque elijo un solo ganador
         */
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        (bool succes, ) = recentWinner.call{value: address(this).balance}("");
        if (!succes) {
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    /* PUBLIC / VIEW FUNCTIONS */

    function getEntranceFee() public view returns (uint256) {
        /*
         * Al hacer la variable immutable ahorro gas, la seteo en el constructor y cualquiera
         * consulta su valor con esta funcion, las view/pure no consumen gas
         */
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }
}
