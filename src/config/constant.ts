import { CHAIN } from '@/types'
export const CHAIN_ID = 56
// export const CHAIN_ID = 84532

export const CHAINS: Record<number, CHAIN> = {
    56: {
        name: 'BSC_MAINNET',
        chainId: 56,
        explorer: 'https://bscscan.com',
        RPC: `https://lb.drpc.org/ogrpc?network=bsc&dkey=${process.env.DRPC_KEY}`,
        ETHERSCAN_API_KEY: 'ZBCM6GT4DBMZ2JIZMQ73BY5W9KK29ED7FS',
        ETHERSCAN_API_URL: 'https://api.bscscan.com',
        UNISWAP_ROUTER_ADDRESS: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
        BRIBE_ADDRESS: '0x1266C6bE60392A8Ff346E8d5ECCd3E69dD9c5F20',
        BRIBE_AMOUNT: 1e12 // 0.000001 eth
    },
    1: {
        name: 'ETH_MAINNET',
        chainId: 1,
        explorer: 'https://etherscan.io',
        RPC: `https://lb.drpc.org/ogrpc?network=ethereum&dkey=${process.env.DRPC_KEY}`,
        ETHERSCAN_API_KEY: 'QJ4UTD1RDZ64DP9G5NMVTCU88H8VYYQQJX',
        ETHERSCAN_API_URL: 'https://etherscan.io/',
        UNISWAP_ROUTER_ADDRESS: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        BRIBE_ADDRESS: '',
        BRIBE_AMOUNT: 1e12 // 0.000001 eth
    },
    11155111: {
        name: 'ETH_SEPOLIA',
        chainId: 11155111,
        explorer: 'https://sepolia.etherscan.io',
        RPC: 'https://boldest-bold-uranium.quiknode.pro/a5e9ce66d6648e49889274a783acd07aebcc02bc/',
        ETHERSCAN_API_KEY: 'QJ4UTD1RDZ64DP9G5NMVTCU88H8VYYQQJX',
        ETHERSCAN_API_URL: 'https://api-sepolia.etherscan.com',
        UNISWAP_ROUTER_ADDRESS: '',
        BRIBE_ADDRESS: '',
        BRIBE_AMOUNT: 1e14 // 0.0001 eth
    },
    84532: {
        name: 'BASE_SEPOLIA',
        chainId: 84532,
        explorer: 'https://sepolia.basescan.org/',
        RPC: 'https://sepolia.base.org',
        ETHERSCAN_API_KEY: 'YRVCE34G8M94GZY1WSVQD7EN9WYX66IN8A',
        ETHERSCAN_API_URL: 'https://api-sepolia.basescan.org/',
        UNISWAP_ROUTER_ADDRESS: '0x1689E7B1F10000AE47eBfE339a4f69dECd19F602',
        BRIBE_ADDRESS: '0x1266C6bE60392A8Ff346E8d5ECCd3E69dD9c5F20',
        BRIBE_AMOUNT: 1e12 // 0.000001 eth
    }
}
