// README.md
# Etherscan Balance Service

This service provides an API endpoint to determine the Ethereum address with the largest balance change in the last 100 blocks.

## Prerequisites

- Node.js (v16 or later)
- npm
- An Etherscan API key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Irek-91/etherscan-balance-service.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your file .env in the root folder and set your Etherscan API key:
   ```
    ETHERSCAN_API_KEY=
   ```

## Running the Service

```bash
npm run start:dev
```

## Usage

Access the endpoint:
```bash
GET http://localhost:3000/api/max-balance-change
```

Example response:
```json
{
  "address": "0x1234abcd...",
  "balanceChange": "1234567890000000000"
}