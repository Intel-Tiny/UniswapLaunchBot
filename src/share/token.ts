import RouterABI from '@/constants/ABI/routerABI.json'
import ContractABI from '@/constants/ABI/contractABI.json'
import V3ContractABI from '@/constants/ABI/v3ContractABI.json'
import { CHAINS } from '@/config/constant'
import { decrypt, getBetweenNumber, localeNumber } from '@/share/utils'
import { ContractFactory, JsonRpcProvider, Wallet, Contract, parseEther, FeeData, formatEther } from 'ethers'
import WethABI from '@/constants/ABI/wethABI.json'
import PositionManagerABI from '@/constants/ABI/positionManagerABI.json'
import { sqrtPriceX96, getPriceToTick } from '@/share/utils'



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
 * @param nonce 
 * @param feeData 
 * @param wallet 
 * @param lpEth 
 * @param routerAddress 
 * @param lpSupply 
 * @param feeTier 
 * @returns 
 */
export const makeApproveTransactionV3 = async (chainId: number, contractAddress: string, tokenAmount: bigint, nonce: number, feeData: FeeData, wallet: Wallet, lpEth: number, routerAddress: string, lpSupply: number, feeTier: number) => {
    let allApproveTx = [];
    const _tokenContract = new Contract(contractAddress, V3ContractABI, wallet)
    const wethAddress = process.env.WETH_ADDRESS
    const wethContract = new Contract(wethAddress, WethABI, wallet)
    const wethBalance = await wethContract.balanceOf(wallet.address)
    const depositEthTx = await wethContract.deposit.populateTransaction({ value: parseEther(String(lpEth)) })
    allApproveTx.push({
        ...depositEthTx,
        chainId,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 1000000,
        nonce: nonce,
        type: 2
    })
    nonce = nonce + 1
    // approve for lp adding
    const approveTx = await _tokenContract.approve.populateTransaction(routerAddress, tokenAmount)
    allApproveTx.push({
        ...approveTx,
        chainId,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 1000000,
        nonce: nonce,
        type: 2
    })
    nonce = nonce + 1
    console.log('approved token amount')
    const wethApproveTx = await wethContract.approve.populateTransaction(routerAddress, wethBalance)
    allApproveTx.push({
        ...wethApproveTx,
        chainId,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 1000000,
        nonce: nonce,
        type: 2
    })
    nonce = nonce + 1

    console.log('::approved weth:')
    // initialize pool
    const routerContract = new Contract(routerAddress, PositionManagerABI, wallet)
    const currentPrice = Number(Number(formatEther(tokenAmount)) * lpSupply * 0.01) / Number(lpEth)
    console.log('current price: ', currentPrice)
    const sqrtPrice = sqrtPriceX96(currentPrice)
    console.log('sqrtPrice -> ', sqrtPrice)
    let token0: any, token1: any
    if (wethAddress.toLowerCase() < contractAddress.toLowerCase()) {
        token0 = wethAddress;
        token1 = contractAddress;
    } else {
        token0 = contractAddress;
        token1 = wethAddress;
    }
    const initializePoolTxData = await routerContract.createAndInitializePoolIfNecessary.populateTransaction(token0, token1, BigInt(feeTier), sqrtPrice)
    allApproveTx.push({
        ...initializePoolTxData,
        chainId,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: 1000000,
        nonce: nonce,
        type: 2
    })
    return allApproveTx
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
 * @param nonce 
 * @param feeData 
 * @param wallet 
 * @param lpSupply 
 * @param lowerPrice 
 * @param higherPrice 
 * @param routerAddress 
 * @param feeTier 
 * @returns 
 */
export const makeAddLpTransactionV3 = async (chainId: number, contractAddress: string, tokenAmount: bigint, lpEth: number, deadline: number, nonce: number, feeData: FeeData, wallet: Wallet, lpSupply: number, lowerPrice: number, higherPrice: number, routerAddress: string, feeTier: number) => {
    const CHAIN = CHAINS[chainId]
    const currentPrice = Number(Number(formatEther(tokenAmount)) * lpSupply * 0.01) / Number(lpEth)
    const tickLower = getPriceToTick((currentPrice * lowerPrice) / 100)
    const tickUpper = getPriceToTick((currentPrice * higherPrice) / 100)
    console.log('tickLower: ', tickLower, ' tickUpper: ', tickUpper)
    let tempTickLower = Math.floor(tickLower / 200) * 200
    let tempTickUpper = Math.floor(tickUpper / 200) * 200
    console.log('tempTickLower:', tempTickLower, ' tempTickUpper: ', tempTickUpper)
    const routerContract = new Contract(routerAddress, PositionManagerABI, wallet)
    const addLpTxData = await routerContract.mint.populateTransaction({
        token0: process.env.WETH_ADDRESS,
        token1: contractAddress,
        fee: BigInt(feeTier),
        tickLower: BigInt(tempTickLower),
        tickUpper: BigInt(tempTickUpper),
        amount0Desired: BigInt(parseEther(String(lpEth))),
        amount1Desired: BigInt(parseEther(String(Number(Number(formatEther(tokenAmount)) * lpSupply * 0.01)))),
        amount0Min: 0,
        amount1Min: 0,
        recipient: wallet.address,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 1800)
    })

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
    feeData: FeeData,
    uniswapV2: boolean,
    fee: number
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

        let nonce = nonceMap.get(wallet.address) ?? (await wallet.getNonce())
        nonceMap.set(wallet.address, nonce + 1)
        // Set your wallet's private key (Use environment variables or .env in real apps)
        let buyLpTxData: any;
        if (uniswapV2) {
            buyLpTxData = await routerContract.swapExactETHForTokensSupportingFeeOnTransferTokens.populateTransaction(
                tokenAmount,
                path,
                wallet.address, // The wallet address
                deadline, // Transaction deadline
                { value: ethAmountPay } // ETH amount being sent with the transaction
            )
        } else {
            const wethContract = new Contract(path[0], WethABI, wallet)
            const wethBalance = await wethContract.balanceOf(wallet.address)
            if (Number(formatEther(wethBalance)) < Number(ethAmountPay)) {
                const depositEthTx = await wethContract.deposit.populateTransaction({ value: ethAmountPay });
                signedTxs.push(
                    await wallet.signTransaction({
                        ...depositEthTx,
                        chainId,
                        maxFeePerGas: feeData.maxFeePerGas,
                        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                        gasLimit: 700000,
                        nonce,
                        type: 2
                    })
                )
                nonce = nonce + 1
            }
            const wethApproveTx = await wethContract.approve.populateTransaction(routerContract.getAddress(), ethAmountPay)
            signedTxs.push(
                await wallet.signTransaction({
                    ...wethApproveTx,
                    chainId,
                    maxFeePerGas: feeData.maxFeePerGas,
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                    gasLimit: 700000,
                    nonce,
                    type: 2
                })
            )
            nonce = nonce + 1
            buyLpTxData = await routerContract.exactInputSingle.populateTransaction({
                tokenIn: path[0],
                tokenOut: path[1],
                fee: fee,
                recipient: wallet.address,
                amountIn: ethAmountPay,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        }

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
        console.log('ethAmountPay: ', ethAmountPay)
        console.log('tokenAmount: ', tokenAmount)
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
