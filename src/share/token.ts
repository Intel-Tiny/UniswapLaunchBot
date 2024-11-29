import RouterABI from '@/constants/ABI/routerABI.json'
import ContractABI from '@/constants/ABI/contractABI.json'
import { CHAINS } from '@/config/constant'
import { decrypt, getBetweenNumber, localeNumber } from '@/share/utils'
import { ContractFactory, JsonRpcProvider, Wallet, Contract, parseEther, FeeData } from 'ethers'

/**
 * make contract deployment tx
 * @param chainId
 * @param abi
 * @param bytecode
 * @param nonce
 * @param feeData
 * @param wallet
 * @returns
 */
export const makeDeploymentTransaction = async (chainId: number, abi: any, bytecode: any, nonce: number, feeData: FeeData, wallet: Wallet) => {
    // Create a contract factory
    const contractFactory = new ContractFactory(abi, bytecode, wallet)
    const deploymentTxData = await contractFactory.getDeployTransaction()
    return {
        ...deploymentTxData,
        chainId,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 10000000,
        nonce: nonce,
        type: 2
    }
}
/**
 * make approve tx
 * @param chainId
 * @param contractAddress
 * @param tokenAmount
 * @param nonce
 * @param feeData
 * @param wallet
 * @returns
 */
export const makeApproveTransaction = async (chainId: number, contractAddress: string, tokenAmount: bigint, nonce: number, feeData: FeeData, wallet: Wallet) => {
    const _tokenContract = new Contract(contractAddress, ContractABI, wallet)
    const _routerAddress = CHAINS[chainId].UNISWAP_ROUTER_ADDRESS
    const approveTxData = await _tokenContract.approve.populateTransaction(_routerAddress, tokenAmount)
    return {
        ...approveTxData,
        chainId,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 1000000,
        nonce: nonce,
        type: 2
    }
}
/**
 *
 * @param chainId
 * @param contractAddress
 * @param tokenAmount
 * @param provider
 * @returns
 */
export const getApproveTransactionFee = async (chainId: number, contractAddress: string, tokenAmount: bigint, provider: JsonRpcProvider) => {
    try {
        const _tokenContract = new Contract(contractAddress, ContractABI, provider)
        const _routerAddress = CHAINS[chainId].UNISWAP_ROUTER_ADDRESS
        const value = await _tokenContract.approve.estimateGas(_routerAddress, tokenAmount)
        return value
    } catch (err) {
        return BigInt(0)
    }
}
/**
 * make addLP transaction data
 * @param chainId
 * @param contractAddress
 * @param tokenAmount
 * @param lpEth
 * @param deadline
 * @param nonce
 * @param feeData
 * @param wallet
 * @returns
 */
export const makeAddLpTransaction = async (chainId: number, contractAddress: string, tokenAmount: bigint, lpEth: number, deadline: number, nonce: number, feeData: FeeData, wallet: Wallet) => {
    const CHAIN = CHAINS[chainId]
    const _routerContract = new Contract(CHAIN.UNISWAP_ROUTER_ADDRESS, RouterABI, wallet)
    const ethAmount = parseEther(String(lpEth))

    const addLpTxData = await _routerContract.addLiquidityETH.populateTransaction(
        contractAddress,
        tokenAmount, // The amount of tokens
        0, // Minimum amount of tokens (set to 0 for no minimum)
        0, // Minimum amount of ETH (set to 0 for no minimum)
        wallet.address, // The wallet address
        deadline, // Transaction deadline
        { value: ethAmount } // ETH amount being sent with the transaction
    )

    return {
        ...addLpTxData,
        chainId,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 1000000,
        nonce: nonce,
        type: 2
    }
}
/**
 *
 * @param chainId
 * @param contractAddress
 * @param tokenAmount
 * @param lpEth
 * @param deadline
 * @param provider
 * @returns
 */
export const getAddLpTransactionFee = async (chainId: number, contractAddress: string, tokenAmount: bigint, lpEth: number, deadline: number, wallet: Wallet) => {
    try {
        const CHAIN = CHAINS[chainId]
        const _routerContract = new Contract(CHAIN.UNISWAP_ROUTER_ADDRESS, RouterABI, wallet)
        const ethAmount = parseEther(String(lpEth))
        console.log('')
        const value = await _routerContract.addLiquidityETH.estimateGas(
            contractAddress,
            tokenAmount, // The amount of tokens
            0, // Minimum amount of tokens (set to 0 for no minimum)
            0, // Minimum amount of ETH (set to 0 for no minimum)
            wallet.address, // The wallet address
            deadline, // Transaction deadline
            { value: ethAmount } // ETH amount being sent with the transaction
        )
        return value
    } catch (err: any) {
        return BigInt(0)
    }
}
/**
 * make buy trx
 * @param chainId
 * @param routerContract
 * @param deployer
 * @param deployerNonce
 * @param walletes
 * @param minBuy
 * @param maxBuy
 * @param jsonRpcProvider
 * @param totalSupply
 * @param path
 * @param deadline
 * @param feeData
 * @returns
 */
export const makeBundleWalletTransaction = async (
    chainId: number,
    routerContract: Contract,
    deployer: string,
    deployerNonce: number,
    walletes: any,
    minBuy: number,
    maxBuy: number,
    jsonRpcProvider: JsonRpcProvider,
    totalSupply: number,
    lpAmount: number,
    lpEth: number,
    path: string[],
    deadline: number,
    feeData: FeeData
) => {
    let signedTxs: string[] = []

    const nonceMap = new Map<string, number>()
    nonceMap.set(deployer, deployerNonce) // use this for nonce maps

    for (let index = 0; index < walletes.length; index++) {
        const privteKey = decrypt(walletes[index].key)
        const wallet = new Wallet(privteKey, jsonRpcProvider)
        const percent = getBetweenNumber(minBuy, maxBuy)
        console.log(`::bundledWallet ${index}`, { token: Math.ceil(totalSupply * percent * 0.01), eth: localeNumber(lpEth * percent * 0.01) })

        const tokenAmount = Math.ceil(totalSupply * percent * 0.01)
        const ethAmountPay = parseEther(localeNumber(lpEth * percent * 0.01))

        const nonce = nonceMap.get(wallet.address) ?? (await wallet.getNonce())
        nonceMap.set(wallet.address, nonce + 1)
        // Set your wallet's private key (Use environment variables or .env in real apps)
        const buyLpTxData = await routerContract.swapExactETHForTokensSupportingFeeOnTransferTokens.populateTransaction(
            tokenAmount,
            path,
            wallet.address, // The wallet address
            deadline, // Transaction deadline
            { value: ethAmountPay } // ETH amount being sent with the transaction
        )
        signedTxs.push(
            await wallet.signTransaction({
                ...buyLpTxData,
                chainId,
                maxFeePerGas: feeData.maxFeePerGas,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                gasLimit: 700000,
                nonce,
                type: 2
            })
        )
    }
    return signedTxs
}
/**
 *
 * @param chainId
 * @param routerContract
 * @param deployer
 * @param minBuy
 * @param maxBuy
 * @param totalSupply
 * @param lpEth
 * @param path
 * @param deadline
 */
export const getBundledWalletTransactionFee = async (chainId: number, routerContract: Contract, deployer: string, minBuy: number, maxBuy: number, totalSupply: number, lpEth: number, path: string[], deadline: number) => {
    try {
        const CHAIN = CHAINS[chainId]
        const provider = new JsonRpcProvider(CHAIN.RPC)
        const privteKey = decrypt(deployer)
        const wallet = new Wallet(privteKey, provider)
        const percent = getBetweenNumber(minBuy, maxBuy)
        // console.log(`::bundledWallet ${index}`, { token: Math.ceil(totalSupply * percent * 0.01), eth: localeNumber(lpEth * percent * 0.01) })

        const tokenAmount = Math.ceil(totalSupply * percent * 0.01)
        const ethAmountPay = parseEther(localeNumber(lpEth * percent * 0.01))
        console.log("ethAmountPay: ", ethAmountPay)
        console.log("tokenAmount: ", tokenAmount)
        // Set your wallet's private key (Use environment variables or .env in real apps)
        const value = await routerContract.swapExactETHForTokensSupportingFeeOnTransferTokens.estimateGas(
            tokenAmount,
            path,
            wallet.address, // The wallet address
            deadline, // Transaction deadline
            { value: ethAmountPay } // ETH amount being sent with the transaction
        )
        return value
    } catch (err: any) {
        return BigInt(0)
    }
}
/**
 * execute signed tx using ethers
 * @param txData
 */
export const executeSimulationTx = async (chainId: number, txData: string) => {
    try {
        const _jsonRpcProvider = new JsonRpcProvider(CHAINS[chainId].RPC)
        const txResponse = await _jsonRpcProvider.broadcastTransaction(txData)
        console.log('Transaction hash:', txResponse.hash)
        // Wait for the transaction to be mined
        const receipt = await txResponse.wait()
        console.log('tx Hash:', receipt.hash)
        console.log('Transaction included in block:', receipt.blockNumber)
    } catch (err) {
        console.error('Error deploying contract:', err)
    }
}
