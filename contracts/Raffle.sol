// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

/* ERRORS */

error Raffle_NotEnoughETHEntered();

contract Raffle {
    /* STATE VARIABLES */

    uint256 private immutable i_entranceFee; // recuerda que las immutables ahorran gas
    address payable[] private s_players;

    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle_NotEnoughETHEntered();
        }
        s_players.push(payable(msg.sender)); // msg.sender por si solo no es payable, tengo q especificarlo
    }

    //function pickRandomWinner() {}

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
}
