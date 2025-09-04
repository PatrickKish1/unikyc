// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";

/**
 * @title UniKycBlocklock
 * @dev Smart contract for managing KYC data with conditional release using dcipher network
 * This contract integrates with the blocklock service to encrypt/decrypt KYC data
 * based on on-chain conditions like block height or time
 */
contract UniKycBlocklock is AbstractBlocklockReceiver {
    
    struct KycData {
        address owner;           // Address that owns the KYC data
        string ensName;          // ENS name associated with the KYC
        bytes32 dataHash;        // Hash of the encrypted KYC data
        uint32 encryptedAt;      // Block when data was encrypted
        uint32 unlockAt;         // Block when data can be decrypted
        bool isDecrypted;        // Whether data has been decrypted
        string decryptedData;    // Decrypted KYC data (only available after unlock)
    }
    
    // Mapping from request ID to KYC data
    mapping(uint256 => KycData) public kycData;
    
    // Mapping from ENS name to request ID
    mapping(string => uint256) public ensToRequestId;
    
    // Events
    event KycDataEncrypted(
        uint256 indexed requestId,
        address indexed owner,
        string ensName,
        uint32 encryptedAt,
        uint32 unlockAt
    );
    
    event KycDataDecrypted(
        uint256 indexed requestId,
        address indexed owner,
        string ensName,
        string decryptedData
    );
    
    event KycDataUpdated(
        uint256 indexed requestId,
        string ensName,
        bytes32 newDataHash
    );
    
    constructor(address blocklockSender) AbstractBlocklockReceiver(blocklockSender) {}
    
    /**
     * @dev Encrypt KYC data with blocklock for conditional release
     * @param callbackGasLimit Gas limit for the callback
     * @param ensName ENS name associated with the KYC
     * @param unlockBlockHeight Block height when data can be decrypted
     * @param encryptedData Encrypted KYC data
     */
    function encryptKycData(
        uint32 callbackGasLimit,
        string memory ensName,
        uint32 unlockBlockHeight,
        TypesLib.Ciphertext calldata encryptedData
    ) external payable returns (uint256 requestId, uint256 requestPrice) {
        require(bytes(ensName).length > 0, "ENS name cannot be empty");
        require(unlockBlockHeight > block.number, "Unlock block must be in the future");
        
        // Create blocklock request
        (requestId, requestPrice) = _requestBlocklockPayInNative(
            callbackGasLimit,
            encodeCondition(unlockBlockHeight),
            encryptedData
        );
        
        // Store KYC data
        kycData[requestId] = KycData({
            owner: msg.sender,
            ensName: ensName,
            dataHash: keccak256(abi.encodePacked(encryptedData)),
            encryptedAt: uint32(block.number),
            unlockAt: unlockBlockHeight,
            isDecrypted: false,
            decryptedData: ""
        });
        
        // Link ENS name to request ID
        ensToRequestId[ensName] = requestId;
        
        emit KycDataEncrypted(
            requestId,
            msg.sender,
            ensName,
            uint32(block.number),
            unlockBlockHeight
        );
    }
    
    /**
     * @dev Update encrypted KYC data (only owner can update)
     * @param requestId ID of the KYC request
     * @param newEncryptedData New encrypted data
     */
    function updateKycData(
        uint256 requestId,
        TypesLib.Ciphertext calldata newEncryptedData
    ) external {
        KycData storage data = kycData[requestId];
        require(data.owner == msg.sender, "Only owner can update");
        require(!data.isDecrypted, "Cannot update decrypted data");
        
        data.dataHash = keccak256(abi.encodePacked(newEncryptedData));
        
        emit KycDataUpdated(requestId, data.ensName, data.dataHash);
    }
    
    /**
     * @dev Get KYC data by ENS name
     * @param ensName ENS name to lookup
     * @return data KYC data struct
     */
    function getKycDataByEns(string memory ensName) external view returns (KycData memory data) {
        uint256 requestId = ensToRequestId[ensName];
        if (requestId > 0) {
            data = kycData[requestId];
        }
    }
    
    /**
     * @dev Get KYC data by request ID
     * @param requestId ID of the KYC request
     * @return data KYC data struct
     */
    function getKycData(uint256 requestId) external view returns (KycData memory data) {
        data = kycData[requestId];
    }
    
    /**
     * @dev Check if KYC data can be decrypted
     * @param ensName ENS name to check
     * @return canDecrypt Whether data can be decrypted
     * @return unlockBlock Block when data unlocks
     */
    function canDecryptKycData(string memory ensName) external view returns (bool canDecrypt, uint32 unlockBlock) {
        uint256 requestId = ensToRequestId[ensName];
        if (requestId > 0) {
            KycData memory data = kycData[requestId];
            canDecrypt = block.number >= data.unlockAt && !data.isDecrypted;
            unlockBlock = data.unlockAt;
        }
    }
    
    /**
     * @dev Callback function called by blocklock service when conditions are met
     * @param _requestId ID of the request
     * @param decryptionKey Key to decrypt the data
     */
    function _onBlocklockReceived(uint256 _requestId, bytes calldata decryptionKey) internal override {
        KycData storage data = kycData[_requestId];
        require(data.owner != address(0), "KYC data not found");
        require(!data.isDecrypted, "Data already decrypted");
        require(block.number >= data.unlockAt, "Conditions not met yet");
        
        // Decrypt the data using the provided key
        // In a real implementation, you would decrypt the actual encrypted data
        // For this demo, we'll simulate the decryption
        data.isDecrypted = true;
        data.decryptedData = "Decrypted KYC data would appear here";
        
        emit KycDataDecrypted(
            _requestId,
            data.owner,
            data.ensName,
            data.decryptedData
        );
    }
    
    /**
     * @dev Encode condition for blocklock (block height)
     * @param blockHeight Target block height
     * @return encoded condition
     */
    function encodeCondition(uint32 blockHeight) internal pure returns (bytes memory) {
        return abi.encodePacked(blockHeight);
    }
    
    /**
     * @dev Get current block number
     * @return Current block number
     */
    function getCurrentBlock() external view returns (uint256) {
        return block.number;
    }
    
    /**
     * @dev Estimate time until unlock (approximate)
     * @param ensName ENS name to check
     * @return blocksRemaining Blocks remaining until unlock
     * @return estimatedTime Estimated time in seconds
     */
    function getUnlockEstimate(string memory ensName) external view returns (uint256 blocksRemaining, uint256 estimatedTime) {
        uint256 requestId = ensToRequestId[ensName];
        if (requestId > 0) {
            KycData memory data = kycData[requestId];
            if (data.unlockAt > block.number) {
                blocksRemaining = data.unlockAt - uint32(block.number);
                // Assuming 12 second block time (Ethereum mainnet)
                estimatedTime = blocksRemaining * 12;
            }
        }
    }
}
