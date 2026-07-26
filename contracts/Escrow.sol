// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract Escrow {
	using SafeERC20 for IERC20;
	IERC20 public immutable usdc;
	
	struct EscrowDetails {
        	address payer;
        	address merchant;
        	uint256 amount;
        	bool funded;
        	bool released;
    	}

	mapping(bytes32 => EscrowDetails) public escrows;

    	event Deposited(
        	bytes32 indexed invoiceHash,
        	address indexed payer,
        	address indexed merchant,
        	uint256 amount
    	);

	event Released(
        	bytes32 indexed invoiceHash,
        	address indexed merchant,
        	uint256 amount
    	);

	constructor(address _usdc) {
		require(_usdc != address(0), "Invalid USDC address");
		usdc = IERC20(_usdc);
	}


	function deposit(
    		string calldata invoiceId,
    		address merchant,
    		uint256 amount
	) external {
		bytes32 invoiceHash = keccak256(bytes(invoiceId));
		require(merchant != address(0), "Invalid merchant");
		require(amount > 0, "Invalid amount");
		require(!escrows[invoiceHash].funded, "Invoice already funded");
		
		usdc.safeTransferFrom(
			msg.sender,
			address(this),
			amount
		);
		
		
		escrows[invoiceHash] = EscrowDetails({
			payer: msg.sender,
			merchant: merchant,
			amount: amount,
			funded: true,
			released: false
		});
		
		emit Deposited(
			invoiceHash,
			msg.sender,
			merchant,
			amount
		);
	}


	function release(string calldata invoiceId) external {

    		bytes32 invoiceHash = keccak256(bytes(invoiceId));

    		EscrowDetails storage escrow = escrows[invoiceHash];

    		require(escrow.funded, "Escrow not funded");
    		require(!escrow.released, "Funds already released");
		require(msg.sender == escrow.payer, "Only payer can release");

		// Effects
		escrow.released = true;

		//interactions
		usdc.safeTransfer(
			escrow.merchant,
			escrow.amount
		);
		
		emit Released(
			invoiceHash,
			escrow.merchant,
			escrow.amount
		);
	}



}

