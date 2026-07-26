# JoPay

JoPay is a stablecoin-powered invoice and escrow platform built for SMEs (Small and Medium Enterprises). It enables merchants to generate invoices, receive customer payments in USDC, and securely settle transactions through an on-chain escrow smart contract deployed on Arc Testnet.

Built for the **Arc × Circle Hackathon** under the **Best SME Trade Finance & Working Capital Workflow** track.


## Problem

Traditional invoice payments expose SMEs to several risks:

- Delayed payments
- Payment disputes
- Lack of payment transparency
- High cross-border settlement costs

JoPay solves these problems by combining stablecoin payments, programmable escrow, and verifiable on-chain settlement.


## Solution

JoPay introduces a secure payment workflow:

1. Merchant creates an invoice.
2. Customer opens the payment link.
3. Customer deposits USDC into an escrow smart contract.
4. Merchant receives confirmation that funds are secured.
5. Customer releases funds after delivery.
6. USDC is transferred directly to the merchant's Circle wallet.
7. Invoice status is updated to **Paid**.



## Features

- Merchant authentication using Supabase Magic Links
- Automatic Circle Wallet creation for merchants
- Invoice generation
- Secure USDC escrow
- Manual release of escrow funds
- Merchant dashboard
- Invoice status tracking
- Payment notifications
- USDC wallet transfers
- Transaction history


## Technology Stack

### Frontend

- React
- Vite
- React Router
- Wagmi
- Viem
- React Icons

### Backend

- Supabase
- Authentication
- PostgreSQL Database
- Edge Functions

### Blockchain

- Arc Testnet
- Solidity Smart Contract
- USDC

### Circle Products

- Circle Wallets
- USDC



## Smart Contract Workflow

### Escrow Deposit

Customer

↓

Approve USDC

↓

Deposit into Escrow

↓

Funds Locked



### Settlement

Customer

↓

Release Funds

↓

Escrow Contract

↓

Merchant Circle Wallet

↓

Invoice marked Paid


## Installation

Clone the repository

```bash
git clone https://github.com/joyogbu/jopay.git
```

Install dependencies

```bash
npm install
```

Run locally

```bash
npm run dev
```



## Environment Variables

Create a `.env` file.

```
VITE_SUPABASE_URL=

VITE_SUPABASE_ANON_KEY=

VITE_CIRCLE_APP_ID=

VITE_CIRCLE_CLIENT_KEY=
```

Supabase Edge Functions also require:

```
SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

CIRCLE_API_KEY
```


## Smart Contract

Deploy the escrow contract to Arc Testnet.

Update:

```
ESCROW_ADDRESS
USDC_ADDRESS
```


## How JoPay Works

### Merchant

- Register
- Verify email
- Circle wallet is created
- Login
- Create invoice
- Share payment link
- Receive payment

### Customer

- Open payment link
- Connect MetaMask
- Approve USDC
- Deposit into escrow
- Release funds



## Circle Products Used

✅ Circle Wallets

- Embedded merchant wallets
- Secure wallet management

✅ USDC

- Stablecoin settlement
- Escrow deposits
- Merchant payouts


## Future Improvements

- Invoice financing
- Tokenized receivables
- Milestone-based escrow
- Credit passport
- Multi-signature escrow
- Real-time notifications
- Cross-chain settlement using CCTP


## Circle Product Feedback

### Why Circle?

Circle Wallets simplified merchant onboarding by allowing wallets to be provisioned without requiring merchants to connect external wallets.

USDC provided a trusted stable settlement asset for invoice payments.

### What worked well

- Circle Wallet API
- Wallet creation flow
- Documentation
- Integration with Arc

### What could be improved

- More end-to-end examples combining Wallets with escrow use cases.
- Additional SDK examples for React + Supabase Edge Functions.
- Improved debugging messages for failed wallet operations.

### Recommendations

- Provide a complete invoice escrow sample application.
- Offer additional templates for trade finance workflows.
- Expand documentation around production wallet lifecycle management.


## Live Demo

https://jopay.vercel.app


## License

MIT
