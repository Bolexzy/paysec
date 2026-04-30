// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.6.1
pragma solidity ^0.8.28;

import {ERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/token/ERC7984.sol";
import {Nox, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @custom:security-contact security@paysecure.app
contract PaySecToken is ERC7984, Ownable {
    constructor(address initialOwner)
        ERC7984("PaySecToken", "PST", "https://paysecure.app/token-metadata.json")
        Ownable(initialOwner)
    {}

    function mint(address to, externalEuint256 encryptedAmount, bytes calldata inputProof)
        external
        onlyOwner
        returns (euint256)
    {
        euint256 amount = Nox.fromExternal(encryptedAmount, inputProof);
        return _mint(to, amount);
    }

    function burn(address from, externalEuint256 encryptedAmount, bytes calldata inputProof)
        external
        onlyOwner
        returns (euint256)
    {
        euint256 amount = Nox.fromExternal(encryptedAmount, inputProof);
        return _burn(from, amount);
    }
}
