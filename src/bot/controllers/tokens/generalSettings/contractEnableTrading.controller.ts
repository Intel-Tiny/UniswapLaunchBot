import Tokens from '@/models/Tokens'
import RouterABI from '@/constants/ABI/routerABI.json'
import { CHAINS, CHAIN_ID } from '@/config/constant'
import { decrypt, replyWithUpdatedMessage, formatNumber, showMessage } from '@/share/utils'
import { Contract, JsonRpcProvider, Wallet, parseUnits, ethers } from 'ethers'
import { executeSimulationTx, makeBundleWalletTransaction, getBundledWalletTransactionFee } from '@/share/token'
import { formatEther } from 'ethers'
import { Markup } from 'telegraf'
import Launches from '@/models/Launch'

export const enableTrandingMenu = async (ctx: any, id: string) => {
    try {
        showMessage(ctx, '⏰ Loading Wallets...')

        const CHAIN = CHAINS[CHAIN_ID]
        const token = await Tokens.findById(id)

        if (!token) {
            return ctx.reply('⚠ There is no token for this id')
        }

        let text =
            `<b>Enable Trading</b>\n` +
            `This will allow users to Swap <code>${token.symbol}</code> on Uniswap.\n\n` +
            (token.bundledWallets.length > 0
                ? `<i>ℹ You have <code>${token.bundledWallets.length}</code> bundled wallets for this token, they will automatically buy tokens at the same time as you activate the swap.</i>\n\n`
                : '<i>ℹ You have <code>NO</code> bundled wallet for this token, so you cannot purchase the token at the same time as enabling the transaction.</i>\n\n') +
            (!token.lpAdded ? `<i>⚠ Liquidity was not been provided yet. Before you can make your token tradable, you need to add liquidity to it.</i>\n\n` : '')
        const bundles = `<b>● Bundled Wallet <code>#${1}</code></b>\n` + `<code>${token.bundledWallets[0]?.address}</code>`

        const provider = new JsonRpcProvider(CHAIN.RPC)
        const { bundledWallets, lpEth, maxBuy } = token
        let requiredEthPerWallet = maxBuy * lpEth * 0.01
        const _privteKey = decrypt(token.bundledWallets[0]?.key)
        const wallet = new Wallet(_privteKey, provider)
        const _routerContract = new Contract(CHAIN.UNISWAP_ROUTER_ADDRESS, RouterABI, wallet)
        const path = [await _routerContract.WETH(), token.address]
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20
        const transactionGas = await getBundledWalletTransactionFee(CHAIN_ID, _routerContract, token.bundledWallets[0]?.key, token.minBuy, token.maxBuy, token.totalSupply, token.lpEth, path, deadline)
        const feeData = await provider.getFeeData()
        const estimateFee = transactionGas * feeData.maxFeePerGas
        console.log('estimateFee: ', estimateFee)
        const requiredEth = Number(requiredEthPerWallet) + Number(formatEther(estimateFee))
        const wallets = await Promise.all(
            token.bundledWallets.map(async (_wallet: { address: string; key: string }, i: number) => {
                const walletAddress = token.bundledWallets[i].address
                try {
                    // Get the balance in wei
                    const balanceWei = await provider.getBalance(walletAddress)
                    // Convert wei to ether
                    const balanceEth = ethers.formatEther(balanceWei)
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

        text += wallets.reduce((msg: string, w: { text: string; valid: boolean }) => msg + w.text, '')

        const inValid = wallets.filter((w: { text: string; valid: boolean }) => !w.valid).length > 0

        if (inValid) {
            text += `\n⚠ Some wallets has no enough ETH to buy tokens as soon as swap is enabled.\n\n`
        }

        console.log({ inValid })

        const settings = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [inValid ? { text: '⚠ Please check above warnings', callback_data: `#` } : { text: '⚡ Enable Trading', callback_data: `enable_trading_${id}` }],
                    [
                        // { text: '↻ Refresh', callback_data: `enable_tradingMenu_${id}` },
                        { text: '← Back', callback_data: `general_settings_${id}` }
                    ]
                ],
                resize_keyboard: true
            }
        }
        replyWithUpdatedMessage(ctx, text, settings)
    } catch (error) {
        await ctx.reply(`<b>❌ Failed in estimating swap Eanble. Please contact with support team</b>`, {
            parse_mode: 'HTML',
            reply_markup: {
                one_time_keyboard: true,
                resize_keyboard: true,
                inline_keyboard: [
                    [
                        { text: '← Back', callback_data: `enable_tradingMenu_${id}` }
                        // { text: 'Try Again', callback_data: `launch_token_${id}` }
                    ]
                ]
            }
        })
    }
}

export const enableTranding = async (ctx: any, id: string) => {
    try {
        ctx.session.mainMsgId = undefined

        const chainId = CHAIN_ID
        const CHAIN = CHAINS[chainId]
        const token = await Tokens.findById(id)
        if (!token) {
            ctx.reply(`⚠ There is no token for this id. Please check it out and try again.`)
            return
        } else if (!token.lpAdded) {
            ctx.reply(`<b>💬 Liquidity was not been provided yet. Before you can make your token tradable, you need to add liquidity to it.</b>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '💦 Liquidity Settings', callback_data: `lp_settings_${id}` }], [{ text: '← Back', callback_data: `general_settings_${id}` }]]
                }
            })
            return
        }

        const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const privteKey = decrypt(token.deployer.key)
        // feeData
        // const feeData = await _jsonRpcProvider.getFeeData()
        const block = await jsonRpcProvider.getBlock('latest')

        // Set the minimum fee (1 gwei) for EIP-1559
        const minGas = parseUnits('1', 'gwei')
        const baseFee = block.baseFeePerGas || parseUnits('1', 'gwei')
        // const feeData = {
        //     gasPrice: minGas,
        //     maxPriorityFeePerGas: minGas,
        //     maxFeePerGas: minGas + baseFee
        // } as FeeData
        const feeData = await jsonRpcProvider.getFeeData()
        // const feeData = {
        //     gasPrice: BigInt(1500326),
        //     maxFeePerGas: BigInt(1500652),
        //     maxPriorityFeePerGas: BigInt(1500000)
        // } as FeeData
        console.log('::new FeeData', feeData)
        // Set your wallet's private key (Use environment variables or .env in real apps)
        const wallet = new Wallet(privteKey, jsonRpcProvider)

        // token contract
        ctx.reply(`⏰ Reading Token Contract...`)
        const tokenContract = new Contract(token.address, token.abi, wallet)
        const swapEnabled = await tokenContract.swapEnabled()
        if (Boolean(swapEnabled)) {
            if (!token.swapEnabled) {
                await Tokens.findByIdAndUpdate(id, { swapEnabled: true })
            }
            ctx.reply(
                `<b>💬 Trading has been already enabled, so You cannot execute again.</b> Please check following details.\n\n` +
                    `<b>Token Address: </b><code>${token.address}</code>\n` +
                    `<u><a href='${CHAIN.explorer}/address/${token.address}'>👁 See Contract on Etherscan</a></u>`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        one_time_keyboard: true,
                        resize_keyboard: true,
                        inline_keyboard: [[{ text: '← Back', callback_data: `general_settings_${id}` }]]
                    }
                }
            )
            return
        }

        // router cotract and path
        const routerContract = new Contract(CHAIN.UNISWAP_ROUTER_ADDRESS, RouterABI, wallet)
        const path = [await routerContract.WETH(), token.address]

        // Get the nonce
        const nonce = await wallet.getNonce()
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20mins from now

        //enable swap Tx Data
        const enableSwapTxData = await tokenContract.enableSwap.populateTransaction()
        const enableSwapSignedTx = {
            ...enableSwapTxData,
            chainId,
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            gasLimit: 1000000,
            nonce: nonce,
            type: 2
        }

        //bribe tx data
        const bribeTxData = {
            from: wallet.address,
            to: CHAIN.BRIBE_ADDRESS,
            value: CHAIN.BRIBE_AMOUNT,
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            gasLimit: 1000000,
            nonce: nonce + 1,
            chainId,
            type: 2
        }
        const bundleWalletsSignedTxs = await makeBundleWalletTransaction(
            chainId,
            routerContract,
            wallet.address,
            nonce + 2,
            token.bundledWallets,
            token.minBuy,
            token.maxBuy,
            jsonRpcProvider,
            token.totalSupply,
            token.lpSupply,
            token.lpEth,
            path,
            deadline,
            feeData
        )

        // setup tx array
        const bundleTxs = [enableSwapSignedTx, bribeTxData]
        // sign bundle txs batch
        const bundleDeployerSignedTxs = await Promise.all(bundleTxs.map(async (b) => await wallet.signTransaction(b)))
        const bundleSignedTxs = [...bundleDeployerSignedTxs, ...bundleWalletsSignedTxs]
        ctx.reply(`⏰ Sending Transactions With Bundles...`)
        // simulate
        await Promise.all(bundleSignedTxs.map((b) => executeSimulationTx(chainId, b)))
        //////////////////////////////////////// sending bundle using blockrazor ///////////////////////////////////////////////
        // const blockNumber: number = await jsonRpcProvider.getBlockNumber()
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

        console.log('::enable trading')
        await Tokens.findByIdAndUpdate(id, { swapEnabled: true })
        const text = `<b>🌺 Now tranding has been enabled, Please check following details.</b>\n\n` + `<b>Token Address: </b><code>${token.address}</code>\n`
        const settings = {
            parse_mode: 'HTML',
            reply_markup: {
                one_time_keyboard: true,
                resize_keyboard: true,
                inline_keyboard: [
                    [Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/address/${token.address}`)],
                    [
                        { text: '← Back', callback_data: `general_settings_${id}` },
                        { text: 'Tokens', callback_data: `tokens` }
                    ]
                ]
            }
        }
        ctx.reply(text, settings)
    } catch (err) {
        console.log(err)
        if (String(err).includes('insufficient funds for intrinsic transaction cost')) {
            await ctx.reply(`<b>❌ Failed in executing Transaction: </b>\n\nTry again with an increased bribe boost of 20% (every time you try again, the bribe boost is increased by 20% from the previous try)`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [
                        [
                            { text: '← Back', callback_data: `enable_tradingMenu_${id}` }
                            // { text: 'Try Again', callback_data: `launch_token_${id}` }
                        ]
                    ]
                }
            })
            await ctx.reply(`<b>❌ Failed in executing Transaction: </b><code>Insufficient funds for gas + value</code>\n\nYou can contact <a href='http://app.support'>Support</a> if necessary`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '← Back', callback_data: `enable_tradingMenu_${id}` }]],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            })
        } else {
            await ctx.reply(`<b>❌ Failed in executing Transaction: </b><code>${String(err).substring(0, 40)}</code>\n\nYou can contact <a href='http://app.support'>Support</a> if necessary`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '← Back', callback_data: `enable_tradingMenu_${id}` }]],
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            })
        }
    }
}
