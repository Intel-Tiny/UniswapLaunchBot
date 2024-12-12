import { CHAIN } from '@/types'
// export const CHAIN_ID = 1
// export const CHAIN_ID = 56
export const CHAIN_ID = 84532

export const CHAINS: Record<number, CHAIN> = {
    56: {
        name: 'BSC_MAINNET',
        chainId: 56,
        explorer: 'https://bscscan.com',
        RPC: `https://lb.drpc.org/ogrpc?network=bsc&dkey=${process.env.DRPC_KEY}`,
        ETHERSCAN_API_KEY: 'ZBCM6GT4DBMZ2JIZMQ73BY5W9KK29ED7FS',
        ETHERSCAN_API_URL: 'https://api.bscscan.com',
        UNISWAP_ROUTER_ADDRESS: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
        UNISWAP_FACTORY_ADDRESS_V3: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7',
        UNISWAP_ROUTER_ADDRESS_V3: '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2',
        POSITION_MANAGER_ADDRESS: '0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613',
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
        UNISWAP_FACTORY_ADDRESS_V3: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        UNISWAP_ROUTER_ADDRESS_V3: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        POSITION_MANAGER_ADDRESS: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
        BRIBE_ADDRESS: '0x35F3FA4B30688815667Eb81Af661b494129F883E',
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
        UNISWAP_ROUTER_ADDRESS_V3: '',
        UNISWAP_FACTORY_ADDRESS_V3: '',
        POSITION_MANAGER_ADDRESS: '',
        BRIBE_ADDRESS: '0x35F3FA4B30688815667Eb81Af661b494129F883E',
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
        UNISWAP_FACTORY_ADDRESS_V3: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
        UNISWAP_ROUTER_ADDRESS_V3: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
        POSITION_MANAGER_ADDRESS: '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2',
        BRIBE_ADDRESS: '0x1266C6bE60392A8Ff346E8d5ECCd3E69dD9c5F20',
        BRIBE_AMOUNT: 1e12 // 0.000001 eth
    }
}
