import { catchContractErrorException, compileContract, decrypt, formatNumber, localeNumber, replyWarningMessage, replyWithUpdatedMessage } from '@/share/utils'
import { ContractFactory, JsonRpcProvider, Wallet, Provider, Contract, parseEther, ZeroAddress, getCreateAddress, FeeData, parseUnits, formatEther } from 'ethers'
import Tokens from '@/models/Tokens'
import Launches, { ILanuch } from '@/models/Launch'
import RouterABI from '@/constants/ABI/routerABI.json'

import { CHAIN_ID } from '@/config/constant'
import { CHAINS } from '@/config/constant'
import { Document, Types } from 'mongoose'
import { executeSimulationTx, makeAddLpTransaction, makeApproveTransaction, makeBundleWalletTransaction, makeDeploymentTransaction, getBundledWalletTransactionFee } from '@/share/token'
import { Markup } from 'telegraf'
import axios from 'axios'

export const menu = async (ctx: any) => {
    const _launches = await Launches.find({ userId: ctx.chat.id, enabled: true })

    const text = `<b>Select a Launch:</b>\n* <i>You can deploy a new token depending on different token settings which you created, </i>`
    const tokens = []

    for (let i = 0; i < _launches.length; i += 2) {
        const element =
            i + 1 >= _launches.length
                ? [{ text: `${i + 1}. ${_launches[i].name}`, callback_data: `pay_launchFilterFeeMenu_${_launches[i].id}` }]
                : [
                      { text: `${i + 1}. ${_launches[i].name}`, callback_data: `pay_launchFilterFeeMenu_${_launches[i].id}` },
                      { text: `${i + 2}. ${_launches[i + 1].name}`, callback_data: `pay_launchFilterFeeMenu_${_launches[i + 1].id}` }
                  ]
        tokens.push(element)
    }
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [_launches.length === 0 ? [{ text: '=== No Launches You Have Created ===', callback_data: '#' }] : [], ...tokens, [{ text: '← back', callback_data: 'launcher' }]],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}
/**
 * preview launch
 * @param ctx
 * @param id
 */
export const payLaunchFilterFeeMenu = async (ctx: any, id: string) => {
    const launch = await Launches.findById(id)
    const CHAIN = CHAINS[CHAIN_ID]

    if (launch) {
        if (launch.isFilterFeePaid) {
            previewLaunch(ctx, id)
        } else {
            //deployer address
            const deployedAddress = launch?.deployer?.address
            const provider = new JsonRpcProvider(CHAIN.RPC)
            // Get the balance in wei
            const balanceWei = await provider.getBalance(deployedAddress)
            // Convert wei to ether
            const balanceEth = formatEther(balanceWei)

            const text =
                `<b>❔ Do you want launch</b> <code>${launch.name}</code> token? Please confirm the following details\n\n` +
                `<b>Deployer:</b> <code>${deployedAddress}</code>\n` +
                `<b>ETH Balance:</b>  <code>${formatNumber(balanceEth)} ETH</code>\n\n` +
                `<b>To launch token, you must pay <code>${process.env.FILTER_FEE_AMOUNT} ETH</code></b>\n` +
                (Number(balanceEth) < Number(process.env.FILTER_FEE_AMOUNT) ? `<i>⚠ You don't have enough ETH in your deployer wallet. Please add funds first</i>` : '')
            const settings = {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [
                        Number(balanceEth) > Number(process.env.FILTER_FEE_AMOUNT) ? [{ text: '💱 Pay Fee', callback_data: `pay_launchFilterFee_${id}` }] : [],
                        [
                            { text: '← Back', callback_data: `launch_token` },
                            { text: '↻ Refresh', callback_data: `pay_launchFilterFeeMenu_${id}` }
                        ]
                    ]
                }
            }
            replyWithUpdatedMessage(ctx, text, settings)
        }
    } else {
        replyWarningMessage(ctx, '⚠ There is no launch for this id. Please check again your launch')
    }
}
/**
 * preview launch
 * @param ctx
 * @param id
 */
export const payLaunchFilterFee = async (ctx: any, id: string) => {
    ctx.session.mainMsgId = undefined

    const launch = await Launches.findById(id)
    const CHAIN = CHAINS[CHAIN_ID]

    if (!launch) {
        replyWarningMessage(ctx, '⚠ There is no launch for this id. Please check again your launch')
        return
    }

    try {
        const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const privateKey = decrypt(launch.deployer.key)
        const wallet = new Wallet(privateKey, jsonRpcProvider)
        // Get the balance in wei
        await ctx.reply(`⏰ Checking ETH balance...`)
        const balanceWei = await jsonRpcProvider.getBalance(launch.deployer.address)
        // Convert wei to ether
        const balanceEth = formatEther(balanceWei)
        const ethAmount = Number(process.env.FILTER_FEE_AMOUNT)

        if (Number(balanceEth) < ethAmount) {
            replyWarningMessage(ctx, `<b>⚠ You don't have enough ETH in your deployer wallet\n</b>Required <code>${process.env.FILTER_FEE_AMOUNT}ETH</code>, but has only <code>${balanceEth}ETH</code>. Please add funds first`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `pay_launchFilterFeeMenu_${id}` }]]
                }
            })
            return
        }

        const txData = {
            to: process.env.DAO_ADDRESS,
            value: parseEther(ethAmount.toString())
            // value: parseEther('1')
        }

        await ctx.reply(`⏰ Sending transaction...`)
        const tx = await wallet.sendTransaction(txData)
        await tx.wait()
        await Launches.findByIdAndUpdate(id, { isFilterFeePaid: true })
        replyWithUpdatedMessage(ctx, `🌺 Successfuly Paid Filter Fee of <code>${ethAmount}ETH</code>.   You can check following details.`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)],
                    [{ text: '🔧 Launch Token', callback_data: `launch_preview_${id}` }],
                    [{ text: '← Back', callback_data: `pay_launchFilterFeeMenu_${id}` }]
                ],
                resize_keyboard: true
            }
        })
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, launch.deployer.address, `pay_launchFilterFeeMenu_${id}`, 'Error while sending Filter Fee')
    }
}
/**
 * preview launch
 * @param ctx
 * @param id
 */
export const previewLaunch = async (ctx: any, id: string) => {
    let summary = ''
    const launch = await Launches.findById(id)

    if (!launch.isFilterFeePaid) {
        replyWithUpdatedMessage(ctx, `You didn't pay filter fee to launch <code>${launch.symbol}</code> token. Please send filter fee first.`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: '← Back', callback_data: `pay_launchFilterFeeMenu_${id}` }]],
                resize_keyboard: true
            }
        })
        return
    } else if (launch.instantLaunch) {
        summary = `Tokens will be deployed, liquidity will be automatically added, and trading will be enabled. At launch, can also purchase some tokens using the bundled wallet.`
    } else if (launch.autoLP) {
        summary = `Tokens will be deployed, liquidity will be automatically added, but cannot be traded until you enable trading in token management.`
    } else {
        summary = `Tokens will be deployed without liquidity and cannot be traded until you add liquidity and enable trading in token management.`
    }

    if (launch) {
        const text =
            `<b>Are you sure you want to launch</b> <code>${launch.name}</code>?\n\n` +
            `<b>Please ensure the following parameters are correct:</b>\n\n` +
            `<i>*Token Name:</i>  <code>${launch.name}</code>\n` +
            `<i>*Symbol:</i>  <code>${launch.symbol}</code>\n` +
            `<i>*Launch Type:</i>  <code>${launch.instantLaunch ? 'Instant Launch' : launch.autoLP ? 'Auto LP' : 'Normal'}</code>\n` +
            `<i>*Total Supply:</i>  <code>${formatNumber(launch.totalSupply)}</code>\n` +
            `<i>*Liquidity:</i>  <code>${formatNumber(launch.totalSupply * launch.lpSupply * 0.01)} ${launch.symbol}</code> + <code>${formatNumber(launch.lpEth)} ETH</code>\n` +
            `<i>*Buy Tax:</i>  <code>${launch.buyFee}%</code>\n` +
            `<i>*Sell Tax:</i>  <code>${launch.sellFee}%</code>\n` +
            `<i>*Liquidity Tax:</i>  <code>${launch.liquidityFee}%</code>\n` +
            `<i>*Max Wallet:</i>  <code>${launch.maxWallet}%</code>\n` +
            `<i>*Max Swap:</i>  <code>${launch.maxSwap}%</code>\n` +
            `\n<b><i>*Summary*</i></b>\n` +
            `<code>${summary}</code>\n`
        const settings = {
            parse_mode: 'HTML',
            reply_markup: {
                one_time_keyboard: true,
                resize_keyboard: true,
                inline_keyboard: [
                    [
                        { text: 'Cancel', callback_data: `launch_token` },
                        { text: 'Confirm', callback_data: `launch_token_${id}` }
                    ]
                ]
            }
        }
        replyWithUpdatedMessage(ctx, text, settings)
    } else {
        ctx.reply('no launch')
    }
}

/**
 * when instant launch
 * @param ctx
 * @param id
 * @param launch
 */
const launchWithInstant = async (
    chainId: number,
    launch: Document<unknown, {}, ILanuch> &
        ILanuch & {
            _id: Types.ObjectId
        } & {
            __v?: number
        },
    abi: any,
    bytecode: any
) => {
    const CHAIN = CHAINS[chainId]

    console.log('::chain info:', CHAIN)

    try {
        // ----------------------------------------------------------------- variables for contract launch --------------------------------------------------------------------------------
        const { lpEth, totalSupply, lpSupply, maxBuy, minBuy, bundledWallets, instantLaunch } = launch

        const _jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const _privteKey = decrypt(launch.deployer.key)
        // feeData
        // const feeData = await _jsonRpcProvider.getFeeData()
        const block = await _jsonRpcProvider.getBlock('latest')

        // Set the minimum fee (1 gwei) for EIP-1559
        const minGas = parseUnits('1', 'gwei')
        const baseFee = block.baseFeePerGas || parseUnits('1', 'gwei')
        // const feeData = {
        //     gasPrice: minGas,
        //     maxPriorityFeePerGas: minGas,
        //     maxFeePerGas: minGas + baseFee
        // } as FeeData
        const feeData = await _jsonRpcProvider.getFeeData()
        // const feeData = {
        //     gasPrice: BigInt(1500326),
        //     maxFeePerGas: BigInt(1500652),
        //     maxPriorityFeePerGas: BigInt(1500000)
        // } as FeeData
        console.log('::new FeeData', feeData)
        // Set your wallet's private key (Use environment variables or .env in real apps)
        const wallet = new Wallet(_privteKey, _jsonRpcProvider)
        // Get the nonce
        const nonce = await wallet.getNonce()
        // Predict contract address
        const contractAddress = getCreateAddress({
            from: wallet.address,
            nonce: nonce
        })
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20mins from now
        // token amount for LP
        // const tokenAmount = parseEther(localeNumber(Number(totalSupply) * Number(lpSupply) * 0.01))
        const tokenAmount = parseEther(String(totalSupply))
        // path
        const _routerContract = new Contract(CHAIN.UNISWAP_ROUTER_ADDRESS, RouterABI, wallet)
        const path = [await _routerContract.WETH(), contractAddress]

        // ----------------------------------------------------------------- transactions for bundle ------------------------------------------------------------------------------------------
        const deploymentTxData = await makeDeploymentTransaction(chainId, abi, bytecode, nonce, feeData, wallet)
        const approveTxData = await makeApproveTransaction(chainId, contractAddress, tokenAmount, nonce + 1, feeData, wallet)
        const addLpTxData = await makeAddLpTransaction(chainId, contractAddress, tokenAmount, lpEth, deadline, nonce + 2, feeData, wallet)
        const bribeTxData = {
            from: wallet.address,
            to: CHAIN.BRIBE_ADDRESS,
            value: CHAIN.BRIBE_AMOUNT,
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            gasLimit: 1000000,
            nonce: nonce + 3,
            chainId,
            type: 2
        }

        const bundleWalletsSignedTxs = await makeBundleWalletTransaction(
            chainId,
            _routerContract,
            wallet.address,
            nonce + 4,
            bundledWallets,
            minBuy,
            maxBuy,
            _jsonRpcProvider,
            launch.totalSupply,
            launch.lpSupply,
            launch.lpEth,
            path,
            deadline,
            feeData
        )
        // setup tx array
        const bundleTxs = [deploymentTxData, approveTxData, addLpTxData, bribeTxData]
        // sign bundle txs batch
        console.log(bundleTxs.length)
        const bundleDeployerSignedTxs = await Promise.all(bundleTxs.map(async (b) => await wallet.signTransaction(b)))
        const bundleSignedTxs = [...bundleDeployerSignedTxs, ...bundleWalletsSignedTxs]

        return Promise.resolve({ address: contractAddress, bundleSignedTxs })
    } catch (err) {
        return Promise.reject(err)
    }
}
/**
 * when none launch
 * @param ctx
 * @param id
 * @param launch
 */
const launchWithNone = async (
    chainId: number,
    launch: Document<unknown, {}, ILanuch> &
        ILanuch & {
            _id: Types.ObjectId
        } & {
            __v?: number
        },
    abi: any,
    bytecode: any
) => {
    const CHAIN = CHAINS[chainId]
    console.log('::chain info:', CHAIN)
    try {
        const _jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const _privteKey = decrypt(launch.deployer.key)
        const wallet = new Wallet(_privteKey, _jsonRpcProvider)
        // Create a ContractFactory with the ABI and bytecode
        const factory = new ContractFactory(abi, bytecode, wallet)
        // Get the nonce
        const nonce = await wallet.getNonce()
        // Deploy the contract
        const contract = await factory.deploy()
        // Wait for the deployment to be mined
        const receipt = await contract.deploymentTransaction().wait()
        // Get the deployed contract address
        const deployedAddress = await contract.getAddress()
        return Promise.resolve({ address: deployedAddress })
    } catch (err) {
        return Promise.reject(err)
    }
}
/**
 * when autoLP launch
 * @param ctx
 * @param id
 * @param launch
 */
const launchWithAutoLP = async (
    chainId: number,
    launch: Document<unknown, {}, ILanuch> &
        ILanuch & {
            _id: Types.ObjectId
        } & {
            __v?: number
        },
    abi: any,
    bytecode: any
) => {
    const CHAIN = CHAINS[chainId]

    console.log('::chain info:', CHAIN)
    try {
        // ----------------------------------------------------------------- variables for contract launch --------------------------------------------------------------------------------
        const { lpEth, totalSupply, lpSupply, maxBuy, minBuy, bundledWallets } = launch
        const _jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const _privteKey = decrypt(launch.deployer.key)
        // feeData
        // const feeData = await _jsonRpcProvider.getFeeData()
        const block = await _jsonRpcProvider.getBlock('latest')

        // Set the minimum fee (1 gwei) for EIP-1559
        const minGas = parseUnits('1', 'gwei')
        const baseFee = block.baseFeePerGas || parseUnits('1', 'gwei')
        // const feeData = {
        //     gasPrice: minGas,
        //     maxPriorityFeePerGas: minGas,
        //     maxFeePerGas: minGas + baseFee
        // } as FeeData
        const feeData = await _jsonRpcProvider.getFeeData()
        console.log('::new FeeData', feeData)
        // Set your wallet's private key (Use environment variables or .env in real apps)
        const wallet = new Wallet(_privteKey, _jsonRpcProvider)
        // Get the nonce
        const nonce = await wallet.getNonce()
        // Predict contract address
        const contractAddress = getCreateAddress({
            from: wallet.address,
            nonce: nonce
        })
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20mins from now
        // token amount for LP
        const tokenAmount = parseEther((Number(totalSupply) * Number(lpSupply) * 0.01).toString())
        // ----------------------------------------------------------------- transactions for bundle ------------------------------------------------------------------------------------------
        const deploymentTxData = await makeDeploymentTransaction(chainId, abi, bytecode, nonce, feeData, wallet)
        const approveTxData = await makeApproveTransaction(chainId, contractAddress, tokenAmount, nonce + 1, feeData, wallet)
        const addLpTxData = await makeAddLpTransaction(chainId, contractAddress, tokenAmount, lpEth, deadline, nonce + 2, feeData, wallet)
        const bribeTxData = {
            from: wallet.address,
            to: CHAIN.BRIBE_ADDRESS,
            value: CHAIN.BRIBE_AMOUNT,
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            gasLimit: 1000000,
            nonce: nonce + 3,
            chainId,
            type: 2
        }
        // setup tx array
        const bundleTxs = [deploymentTxData, approveTxData, addLpTxData, bribeTxData]
        const bundleDeployerSignedTxs = await Promise.all(bundleTxs.map(async (b) => await wallet.signTransaction(b)))
        const bundleSignedTxs = [...bundleDeployerSignedTxs]
        return Promise.resolve({ address: contractAddress, bundleSignedTxs })
    } catch (err) {
        return Promise.reject(err)
    }
}

/**
 * token launch
 * @param ctx
 * @param id
 */
export const tokenLaunch = async (ctx: any, id: string) => {
    const chainId = CHAIN_ID
    const CHAIN = CHAINS[chainId]
    const launch = await Launches.findById(id)
    if (!launch) {
        ctx.reply(`⚠ There is no launch for this. Please check again`)
        return
    }

    try {
        ctx.session.mainMsgId = undefined
        ctx.reply(`🕐 Compiling contract...`)
        console.log('::compiling contract...')
        const { abi, bytecode, sourceCode } = (await compileContract({
            chainId: chainId,
            name: launch.name,
            symbol: launch.symbol,
            totalSupply: launch.totalSupply,
            maxSwap: launch.maxSwap,
            maxWallet: launch.maxWallet,
            sellFee: launch.sellFee,
            buyFee: launch.buyFee,
            liquidityFee: launch.liquidityFee,
            swapThreshold: launch.swapThreshold,
            instantLaunch: launch.instantLaunch,
            feeWallet: launch.feeWallet == 'Deployer Wallet' ? launch.deployer.address : launch.feeWallet,
            website: launch.website,
            twitter: launch.twitter,
            telegram: launch.telegram,
            custom: launch.custom
        })) as any

        let contractAddress = ''

        if (launch.instantLaunch) {
            const provider = new JsonRpcProvider(CHAINS[CHAIN_ID].RPC)
            let requiredEthPerWallet = launch.maxBuy * launch.lpEth * 0.01
            const _privteKey = decrypt(launch.bundledWallets[0]?.key)
            const wallet = new Wallet(_privteKey, provider)
            const nonce = await wallet.getNonce()
            // predict contract address
            contractAddress = getCreateAddress({
                from: wallet.address,
                nonce: nonce
            })
            const _routerContract = new Contract(CHAIN.UNISWAP_ROUTER_ADDRESS, RouterABI, wallet)
            const path = [await _routerContract.WETH(), contractAddress]
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20
            const transactionGas = await getBundledWalletTransactionFee(CHAIN_ID, _routerContract, launch.bundledWallets[0]?.key, launch.minBuy, launch.maxBuy, launch.totalSupply, launch.lpEth, path, deadline)
            const feeData = await provider.getFeeData()
            const estimateFee = transactionGas * feeData.maxFeePerGas
            console.log('estimateFee: ', estimateFee)
            const requiredEth = Number(requiredEthPerWallet) + Number(formatEther(estimateFee))
            const wallets = await Promise.all(
                launch.bundledWallets.map(async (_wallet: { address: string; key: string }, i: number) => {
                    const walletAddress = launch.bundledWallets[i].address
                    try {
                        // Get the balance in wei
                        const balanceWei = await provider.getBalance(walletAddress)
                        // Convert wei to ether
                        const balanceEth = formatEther(balanceWei)
                        const valid = Number(balanceEth) > Number(requiredEth)
                        return {
                            text: `🔹 <b>Wallet#${i + 1}</b> 🔹 \n  <code>${walletAddress}</code>\n   <i>*Required:</i> <code>${requiredEth} ETH</code> \n   <i>*Balance:</i> <code>${formatNumber(balanceEth)} ETH</code>  ${valid ? '' : '⚠'}\n\n`,
                            valid: valid
                        }
                    } catch (err) {
                        return {
                            text: `🔹 <b>Wallet#${i + 1}</b> 🔹 \n  <code>${walletAddress}</code>\n   <i>*Required:</i> <code>${requiredEth} ETH</code> \n   <i>*Balance:</i> <code>0 ETH</code>  ⚠\n\n`,
                            valid: false
                        }
                    }
                })
            )
            let text = wallets.reduce((msg: string, w: { text: string; valid: boolean }) => msg + w.text, '')
            const inValid = wallets.filter((w: { text: string; valid: boolean }) => !w.valid).length > 0

            if (inValid) {
                text += `⚠ Some wallets has no enough ETH to buy tokens as soon as swap is enabled.\n\n`
                await ctx.reply(text, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        one_time_keyboard: true,
                        resize_keyboard: true,
                        inline_keyboard: [
                            [
                                { text: '← Back', callback_data: `launch_preview_${id}` },
                                { text: 'Try Again', callback_data: `launch_token_${id}` }
                            ]
                        ]
                    }
                })

                return
            }
        }

        //if launch is instant or autoLP
        if (launch.instantLaunch || launch.autoLP) {
            const { bundleSignedTxs, address } = launch.instantLaunch ? await launchWithInstant(chainId, launch, abi, bytecode) : await launchWithAutoLP(chainId, launch, abi, bytecode)
            await Promise.all(bundleSignedTxs.map((b) => executeSimulationTx(chainId, b)))
            ////////////////////////////////////////// sending bundle using blockrazor ///////////////////////////////////////////////
            // const _jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
            // const blockNumber: number = await _jsonRpcProvider.getBlockNumber()
            // const nextBlock = blockNumber
            // const requestData = {
            //     jsonrpc: '2.0',
            //     id: '1',
            //     method: 'eth_sendMevBundle',
            //     params: [
            //         {
            //             txs: bundleSignedTxs, // List of signed raw transactions
            //             maxBlockNumber: nextBlock + 100 // The maximum block number for the bundle to be valid, with the default set to the current block number + 100
            //             // "minTimestamp":1710229370,   // Expected minimum Unix timestamp (in seconds) for the bundle to be valid
            //             // "maxTimestamp":1710829390,   // Expected maximum Unix timestamp (in seconds) for the bundle to be valid
            //         }
            //     ]
            // }
            // const config = {
            //     headers: {
            //         'Content-Type': 'application/json'
            //         // Authorization: AUTH_HEADER
            //     }
            // }
            // try {
            //     console.log('::sending bundles...')
            //     const response = await axios.post(`https://bsc.blockrazor.xyz/${process.env.BLOCK_API_KEY}`, requestData, config)
            //     console.log('::sent...')
            //     console.log('response.data: ', response.data)
            // } catch (error) {
            //     console.error('Error in sending bundle transaction:')
            //     throw 'Error in sending bundle transaction'
            // }
            ////////////////////////////////////////// end sending bundle using blockrazor ///////////////////////////////////////////////

            contractAddress = address as string
            console.log('::ended::::')
            new Tokens({
                userId: ctx.chat.id,
                instantLaunch: launch.instantLaunch,
                autoLP: launch.autoLP,
                lpAdded: true,
                swapEnabled: launch.instantLaunch,
                name: launch.name,
                symbol: launch.symbol,
                totalSupply: launch.totalSupply,
                maxSwap: launch.maxSwap,
                maxWallet: launch.maxWallet,
                blacklistCapability: launch.blacklistCapability,
                lpSupply: launch.lpSupply,
                lpEth: launch.lpEth,
                contractFunds: launch.contractFunds,
                feeWallet: launch.feeWallet,
                buyFee: launch.buyFee,
                sellFee: launch.sellFee,
                liquidityFee: launch.liquidityFee,
                swapThreshold: launch.swapThreshold,
                website: launch.website,
                twitter: launch.twitter,
                telegram: launch.telegram,
                custom: launch.custom,
                deployer: launch.deployer,
                bundledWallets: launch.bundledWallets,
                minBuy: launch.minBuy,
                maxBuy: launch.maxBuy,
                // contract data
                address: address,
                verified: false,
                abi: JSON.stringify(abi),
                byteCode: bytecode,
                sourceCode: sourceCode
            }).save()
        } else {
            const { address } = await launchWithNone(chainId, launch, abi, bytecode)
            contractAddress = address as string
            console.log('::ended::::')
            new Tokens({
                userId: ctx.chat.id,
                instantLaunch: launch.instantLaunch,
                autoLP: launch.autoLP,
                lpAdded: false,
                swapEnabled: false,
                name: launch.name,
                symbol: launch.symbol,
                totalSupply: launch.totalSupply,
                maxSwap: launch.maxSwap,
                maxWallet: launch.maxWallet,
                blacklistCapability: launch.blacklistCapability,
                lpSupply: launch.lpSupply,
                lpEth: launch.lpEth,
                contractFunds: launch.contractFunds,
                feeWallet: launch.feeWallet,
                buyFee: launch.buyFee,
                sellFee: launch.sellFee,
                liquidityFee: launch.liquidityFee,
                swapThreshold: launch.swapThreshold,
                website: launch.website,
                twitter: launch.twitter,
                telegram: launch.telegram,
                custom: launch.custom,
                deployer: launch.deployer,
                bundledWallets: launch.bundledWallets,
                minBuy: launch.minBuy,
                maxBuy: launch.maxBuy,
                // contract data
                address: address,
                verified: false,
                abi: JSON.stringify(abi),
                byteCode: bytecode,
                sourceCode: sourceCode
            }).save()
        }
        // delete launch
        await Launches.deleteMany({ _id: id })

        const text = `<b>🌺 Contract has been deployed successfully, Please check following details.</b>\n\n` + `<b>Address: </b><code>${contractAddress}</code>\n`
        const settings = {
            parse_mode: 'HTML',
            reply_markup: {
                one_time_keyboard: true,
                resize_keyboard: true,
                inline_keyboard: [
                    [Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/address/${contractAddress}`)],
                    [
                        { text: '← Back', callback_data: `launch_token` },
                        { text: 'Tokens', callback_data: `tokens` }
                    ]
                ]
            }
        }
        ctx.reply(text, settings)
    } catch (err) {
        console.log(err)
        if (String(err).includes('insufficient funds for intrinsic transaction cost')) {
            await ctx.reply(`<b>❌ Deployment failed.</b>\n\nTry again with an increased bribe boost of 20% (every time you try again, the bribe boost is increased by 20% from the previous try)`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [
                        [
                            { text: '← Back', callback_data: `launch_preview_${id}` },
                            { text: 'Try Again', callback_data: `launch_token_${id}` }
                        ]
                    ]
                }
            })
            await ctx.reply(`<b>Deployment Error: </b><code>Insufficient funds for gas + value</code>\n\nYou can contact <a href='http://app.support'>Support</a> if necessary`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '← Back', callback_data: `launch_preview_${id}` }]],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            })
        } else {
            await ctx.reply(`<b>Deployment Error: </b><code>${String(err).substring(0, 40)}</code>\n\nYou can contact <a href='http://app.support'>Support</a> if necessary`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '← Back', callback_data: `launch_preview_${id}` }]],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            })
        }
    }
}
