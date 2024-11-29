export type SESSION = {
    bundled_snipers: boolean
    instant_launch: boolean
    auto_lp: boolean
    currentSelectType: string
    token_max_swap: number
    token_max_wallet: number
    blacklist_capability: boolean
}

export type CHAIN = {
    name: string
    chainId: number
    explorer: string
    RPC: string
    ETHERSCAN_API_KEY: string
    ETHERSCAN_API_URL: string
    UNISWAP_ROUTER_ADDRESS: string
    BRIBE_ADDRESS: string
    BRIBE_AMOUNT: number
}
