// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC20ToERC7984Wrapper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NovaPay is Ownable {

    // ─────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────

    // ERC-7984 confidential token wrapper (deployed separately)
    IERC20ToERC7984Wrapper public confidentialToken;

    // The underlying ERC-20 (e.g. USDC on Arbitrum Sepolia)
    IERC20 public baseToken;

    // Invoice storage
    struct Invoice {
        address creator;         // freelancer
        address payer;           // client
        bytes encryptedAmount;   // amount encrypted with payer's pubkey
        string refId;            // e.g. "INV-001"
        uint256 dueDate;
        bool paid;
        uint256 createdAt;
    }

    // invoiceId → Invoice
    mapping(bytes32 => Invoice) public invoices;

    // Payroll: employer → list of payroll run IDs
    mapping(address => bytes32[]) public payrollRuns;

    struct PayrollRun {
        address[] recipients;
        uint256 timestamp;
        uint256 recipientCount;
    }

    mapping(bytes32 => PayrollRun) public payrollRunDetails;

    // ─────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────

    event PrivateSent(
        address indexed from,
        address indexed to,
        uint256 timestamp
        // NOTE: amount intentionally NOT emitted — stays private
    );

    event InvoiceCreated(
        bytes32 indexed invoiceId,
        address indexed creator,
        address indexed payer,
        string refId,
        uint256 dueDate
    );

    event InvoicePaid(
        bytes32 indexed invoiceId,
        address indexed payer,
        uint256 timestamp
        // NOTE: amount intentionally NOT emitted
    );

    event PayrollRunEvent(
        bytes32 indexed runId,
        address indexed employer,
        uint256 recipientCount,
        uint256 timestamp
        // NOTE: individual amounts NOT emitted
    );

    // ─────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(
        address _confidentialToken,
        address _baseToken
    ) Ownable(msg.sender) {
        confidentialToken = IERC20ToERC7984Wrapper(_confidentialToken);
        baseToken = IERC20(_baseToken);
    }

    // ─────────────────────────────────────────
    // FLOW 1: PRIVATE SEND
    // ─────────────────────────────────────────

    /**
     * @notice Wrap ERC-20 and send as confidential token in one tx
     * @param recipient The address to send to
     * @param amount    The amount to wrap and send (in base token decimals)
     */
    function wrapAndSend(
        address recipient,
        uint256 amount
    ) external {
        require(recipient != address(0), "NovaPay: invalid recipient");
        require(amount > 0, "NovaPay: amount must be > 0");

        bool pulled = baseToken.transferFrom(msg.sender, address(this), amount);
        require(pulled, "NovaPay: token transfer failed");

        baseToken.approve(address(confidentialToken), amount);

        // wrap(to, amount) — wraps and mints confidential tokens directly to recipient
        confidentialToken.wrap(recipient, amount);

        emit PrivateSent(msg.sender, recipient, block.timestamp);
    }

    // ─────────────────────────────────────────
    // FLOW 2: CONFIDENTIAL INVOICE
    // ─────────────────────────────────────────

    /**
     * @notice Create a confidential invoice
     * @param payer           Client's wallet address
     * @param encryptedAmount Amount encrypted with payer's public key (done off-chain)
     * @param refId           Invoice reference e.g. "INV-001"
     * @param dueDate         Unix timestamp for due date
     */
    function createInvoice(
        address payer,
        bytes calldata encryptedAmount,
        string calldata refId,
        uint256 dueDate
    ) external returns (bytes32 invoiceId) {
        require(payer != address(0), "NovaPay: invalid payer");
        require(encryptedAmount.length > 0, "NovaPay: empty encrypted amount");
        require(dueDate > block.timestamp, "NovaPay: due date in past");

        invoiceId = keccak256(
            abi.encodePacked(msg.sender, payer, refId, block.timestamp)
        );

        require(
            invoices[invoiceId].creator == address(0),
            "NovaPay: invoice already exists"
        );

        invoices[invoiceId] = Invoice({
            creator: msg.sender,
            payer: payer,
            encryptedAmount: encryptedAmount,
            refId: refId,
            dueDate: dueDate,
            paid: false,
            createdAt: block.timestamp
        });

        emit InvoiceCreated(invoiceId, msg.sender, payer, refId, dueDate);

        return invoiceId;
    }

    /**
     * @notice Pay an invoice
     * @param invoiceId  The invoice to pay
     * @param amount     The actual amount (payer decrypted this off-chain, now pays it)
     */
    function payInvoice(
        bytes32 invoiceId,
        uint256 amount
    ) external {
        Invoice storage invoice = invoices[invoiceId];

        require(invoice.creator != address(0), "NovaPay: invoice not found");
        require(!invoice.paid, "NovaPay: already paid");
        require(invoice.payer == msg.sender, "NovaPay: not the payer");
        require(block.timestamp <= invoice.dueDate, "NovaPay: invoice overdue");
        require(amount > 0, "NovaPay: amount must be > 0");

        invoice.paid = true;

        bool pulled = baseToken.transferFrom(msg.sender, address(this), amount);
        require(pulled, "NovaPay: token transfer failed");

        baseToken.approve(address(confidentialToken), amount);
        confidentialToken.wrap(invoice.creator, amount);

        emit InvoicePaid(invoiceId, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────
    // FLOW 3: CONFIDENTIAL PAYROLL
    // ─────────────────────────────────────────

    /**
     * @notice Run payroll — batch confidential transfers
     * @param recipients  Array of employee wallet addresses
     * @param amounts     Array of salary amounts (parallel to recipients)
     */
    function runPayroll(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external returns (bytes32 runId) {
        require(recipients.length > 0, "NovaPay: no recipients");
        require(
            recipients.length == amounts.length,
            "NovaPay: length mismatch"
        );
        require(recipients.length <= 100, "NovaPay: max 100 recipients");

        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "NovaPay: zero amount for recipient");
            total += amounts[i];
        }

        bool pulled = baseToken.transferFrom(msg.sender, address(this), total);
        require(pulled, "NovaPay: token transfer failed");

        // Approve full total upfront so each wrap() call can pull its share
        baseToken.approve(address(confidentialToken), total);

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "NovaPay: invalid recipient");
            confidentialToken.wrap(recipients[i], amounts[i]);
        }

        runId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, recipients.length)
        );

        payrollRunDetails[runId] = PayrollRun({
            recipients: recipients,
            timestamp: block.timestamp,
            recipientCount: recipients.length
        });

        payrollRuns[msg.sender].push(runId);

        emit PayrollRunEvent(runId, msg.sender, recipients.length, block.timestamp);

        return runId;
    }

    /**
     * @notice Get all payroll run IDs for the calling employer
     */
    function getMyPayrollRuns() external view returns (bytes32[] memory) {
        return payrollRuns[msg.sender];
    }

    /**
     * @notice Get payroll run details (recipient count + timestamp, not amounts)
     */
    function getPayrollRunDetails(
        bytes32 runId
    ) external view returns (address[] memory recipients, uint256 timestamp) {
        PayrollRun storage run = payrollRunDetails[runId];
        return (run.recipients, run.timestamp);
    }
}
