import Launches from '@/models/Launch'
import Tokens from '@/models/Tokens'
import { CHAIN_ID, CHAINS } from '@/config/constant'
import { catchContractErrorException, compileContract, compileContractForEstimation, formatNumber, replyWithUpdatedMessage } from '@/share/utils'
import { Contract, ContractFactory, ethers, formatEther, isAddress, JsonRpcProvider, parseEther, Wallet } from 'ethers'
import { decrypt } from '@/share/utils'
import { Markup } from 'telegraf'
import { getAddLpTransactionFee, getApproveTransactionFee } from '@/share/token'

export const manageDeployer = async (ctx: any, id: string) => {
    const CHAIN = CHAINS[CHAIN_ID]

    const isToken = id.startsWith('token')
    const launch = isToken ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)
    const provider = new JsonRpcProvider(CHAIN.RPC)
    const deployerAddress = launch.deployer?.address || ''
    // Get the balance in wei
    const balanceWei = await provider.getBalance(deployerAddress)
    // Convert wei to ether
    const balanceEth = ethers.formatEther(balanceWei)
    ctx.session.currentTag = 'manageDeployer'
    const text =
        `<b>Deployer</b>\n` +
        `Use this menu to manage your deployer\n\n` +
        `<b>Send ETH</b> –  Transfer ETH to another Address. You can send specific amount of ETH to another wallet.\n` +
        (!isToken
            ? `<b>Estimate Deployment Cost</b> – Using the current GWEI, GridBot will estimate the cost of deployment for your Token Launch. This is the minimum amount of ETH that will be required to be in the Deployer at the time of launch. This does not include the ETH required to be added to the Liquidity Pool(LP)\n\n`
            : '\n\n') +
        `Address: <code>${deployerAddress}</code>\n` +
        `Balance: <code>${formatNumber(balanceEth)} ETH</code>\n`

    const inline_keyboard = isToken
        ? [
              [{ text: '←️ Back', callback_data: 'deployers' }],
              [
                  { text: '📤 Send ETH', callback_data: `send_eth_${id}` },
                  { text: `🌘 Send ${launch.symbol}`, callback_data: `send_token_${id}` }
              ]
          ]
        : [
              [{ text: '←️ Back', callback_data: `manage_launch_${id}` }],
              [
                  { text: '📤 Send ETH', callback_data: `send_eth_${id}` },
                  { text: '📐 Estimate Deployment Cost', callback_data: `estimate_DeploymentCost_${id}` }
              ],
              [{ text: '🔮 Predict Token Address', callback_data: `predict_tokenAddress_${id}` }]
          ]
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            one_time_keyboard: true,
            inline_keyboard: inline_keyboard,
            // eslint-disable-next-line prettier/prettier
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

export const sendEth = async (ctx: any, id: string) => {
    const launch = id ? (id.startsWith('token') ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    const CHAIN = CHAINS[CHAIN_ID]
    const provider = new JsonRpcProvider(CHAIN.RPC)
    const deployerAddress = launch.deployer?.address || ''
    // Get the balance in wei
    const balanceWei = await provider.getBalance(deployerAddress)

    const receiverAddress = ctx.session?.ethReceiveAddress
    const amount = ctx.session?.ethReceiverAmount
    console.log('receiverAddress:amount', receiverAddress, amount)

    const text =
        `<b>Send ETH</b>\n` +
        `Use this menu to send ETH from your deployer. You can send specific amount of ETH from your deployer wallet to another one.\n\n` +
        `▰ <a href='${CHAIN.explorer}/address/${deployerAddress}'>deployer</a> ▰\n` +
        `<code>${deployerAddress}</code>\n` +
        `Balance: <code>${formatNumber(formatEther(balanceWei))} ETH </code>\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            one_time_keyboard: true,
            resize_keyboard: true,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            inline_keyboard: [
                [
                    { text: `Receiver: ${receiverAddress ? receiverAddress : 'Unset'}`, callback_data: `scene_ethToAddressEditScene_${id}` },
                    { text: `Amount: ${amount ? amount : '0.0'} ETH`, callback_data: `scene_ethSendAmountEditScene_${id}` }
                ],
                [
                    { text: '← Back', callback_data: `manage_deployer_${id}` },
                    { text: '📤 Send ETH', callback_data: `sendEth_confirm_${id}` }
                ]
            ]
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

export const sendToken = async (ctx: any, id: string) => {
    console.log('here')
    const token = await Tokens.findById(id.substr(5))

    const CHAIN = CHAINS[CHAIN_ID]
    const provider = new JsonRpcProvider(CHAIN.RPC)
    const deployerAddress = token?.deployer?.address
    // Get the balance in wei
    const balanceWei = await provider.getBalance(deployerAddress)
    // contract
    const contract = new Contract(token.address, token.abi, provider)
    const _tokenBalance = await contract.balanceOf(deployerAddress)

    const receiverAddress = ctx.session?.tokenReceiverAddress
    const amount = ctx.session?.tokenReceiverAmount
    console.log('receiverAddress:amount', receiverAddress, amount)

    const text =
        `<b>Deployer Send [$${token.symbol}]</b>\n` +
        `Use this to send ${token.symbol} to another address. Please check following details.\n\n` +
        `▰ <a href='${CHAIN.explorer}address/${deployerAddress}'>deployer</a> ▰\n` +
        `<code>${deployerAddress}</code>\n` +
        `<b>ETH Balance:</b> <code>${formatNumber(formatEther(balanceWei))} ETH </code>\n` +
        `<b>${token.symbol} Balance:</b> <code>${formatNumber(formatEther(_tokenBalance))} ${token.symbol} </code>\n`
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            one_time_keyboard: true,
            resize_keyboard: true,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            inline_keyboard: [
                [
                    { text: `Receiver: ${receiverAddress ? receiverAddress : 'Unset'}`, callback_data: `scene_tokenDeployerAddrEditScene_${id}` },
                    { text: `Amount: ${amount ? amount : '0.0'} ${token.symbol}`, callback_data: `scene_tokenDeployerAmountEditScene_${id}` }
                ],
                [
                    { text: '← Back', callback_data: `manage_deployer_${id}` },
                    { text: '📤 Send Token', callback_data: `sendToken_confirm_${id}` }
                ]
            ]
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

export const sendEthConfirm = async (ctx: any, id: string) => {
    ctx.session.mainMsgId = undefined

    const launch = id ? (id.startsWith('token') ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    const CHAIN = CHAINS[CHAIN_ID]
    try {
        const provider = new JsonRpcProvider(CHAIN.RPC)
        const privateKey = decrypt(launch.deployer.key)
        const deployerAddress = launch.deployer?.address
        const wallet = new Wallet(privateKey, provider)
        // Convert the amount from ether to wei
        const amountInEther = Number(ctx.session?.ethReceiverAmount)
        if (isNaN(amountInEther)) {
            replyWithUpdatedMessage(ctx, `⚠ Invalid ETH amount to send. Please try again after checking.`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_eth_${id}` }]]
                }
            })
            return
        }
        const amountWei = ethers.parseEther(amountInEther.toFixed(18))
        // Get the balance in wei
        await ctx.reply(`⏰ Checking Balance...`)
        const balanceWei = await provider.getBalance(deployerAddress)
        const balanceEth = formatEther(balanceWei)
        //balance checking
        if (Number(balanceEth) < Number(amountInEther)) {
            replyWithUpdatedMessage(ctx, `<b>⚠ You don't have enough ETH in your deployer wallet\n</b>Required <code>${amountInEther}ETH</code>, but has only <code>${balanceEth}ETH</code>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_eth_${id}` }]]
                }
            })
            return
        }

        // Create the transaction object
        const toAddress = ctx.session?.ethReceiveAddress
        // receiver checking
        if (!isAddress(toAddress)) {
            replyWithUpdatedMessage(ctx, `<b>⚠ Invalid ETH address\n</b><code>${toAddress}</code> must be valid ETH address. Please try again after checking`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_eth_${id}` }]]
                }
            })
            return
        }
        // fee data
        const feeData = await provider.getFeeData()
        const tx = {
            to: toAddress,
            value: amountWei,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            maxFeePerGas: feeData.maxFeePerGas,
            gasLimit: 3000000
        }
        // Send the transaction
        await ctx.reply(`⏰ Sending <code>${amountInEther}ETH</code> to <code>${toAddress}</code>...`, { parse_mode: 'HTML' })
        const transaction = await wallet.sendTransaction(tx)

        // Wait for the transaction to be mined
        const receipt = await transaction.wait()
        replyWithUpdatedMessage(ctx, `🌺 Successfuly sent <code>${amountInEther}ETH</code> to <code>${toAddress}</code>. You can check following details.`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${receipt.hash}`)], [{ text: '← Back', callback_data: `send_eth_${id}` }]],
                resize_keyboard: true
            }
        })
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, launch?.deployer?.address, `send_eth_${id}`, 'Error while Sending ETH')
    }
}
/**
 * when click confirm button to send tokens form deployer
 * @param ctx
 * @param id
 * @returns
 */
export const sendTokenConfirmDeployer = async (ctx: any, id: string) => {
    ctx.session.mainMsgId = undefined
    const token = await Tokens.findById(id.substr(5))
    const CHAIN = CHAINS[CHAIN_ID]
    try {
        const provider = new JsonRpcProvider(CHAIN.RPC)
        const privateKey = decrypt(token.deployer.key)
        const deployerAddress = token.deployer?.address
        const wallet = new Wallet(privateKey, provider)
        // Convert the amount from ether to wei
        const amountInEther = Number(ctx.session?.tokenReceiverAmount)
        console.log('amountInEther: ', amountInEther)
        if (isNaN(amountInEther)) {
            replyWithUpdatedMessage(ctx, `⚠ Invalid Token amount to send. Please try again after checking.`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_token_${id}` }]]
                }
            })
            return
        }
        const amountWei = ethers.parseEther(amountInEther.toFixed(18))
        // Get the balance in wei
        await ctx.reply(`⏰ Checking Balance...`)
        // contract
        const contract = new Contract(token.address, token.abi, wallet)
        const _tokenBalance = await contract.balanceOf(deployerAddress)
        const _tokenBalanceInEther = formatEther(_tokenBalance)
        //balance checking
        if (Number(_tokenBalanceInEther) < Number(amountInEther)) {
            replyWithUpdatedMessage(ctx, `<b>⚠ You don't have enough Tokens in your deployer wallet\n</b>Required <code>${amountInEther} ${token.symbol}</code>, but has only <code>${_tokenBalanceInEther}${token.symbol}</code>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_token_${id}` }]]
                }
            })
            return
        }

        // Create the transaction object
        const toAddress = ctx.session?.tokenReceiverAddress
        // receiver checking
        if (!isAddress(toAddress)) {
            replyWithUpdatedMessage(ctx, `<b>⚠ Invalid ETH address\n</b><code>${toAddress}</code> must be valid ETH address.`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_token_${id}` }]]
                }
            })
            return
        }

        await ctx.reply(`⏰ Sending <code>${formatNumber(amountInEther)}${token.symbol}</code> to <code>${toAddress}</code>...`, {
            parse_mode: 'HTML'
        })
        // fee data
        const feeData = await provider.getFeeData()
        const transaction = await contract.transfer(toAddress, amountWei, {
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            maxFeePerGas: feeData.maxFeePerGas,
            gasLimit: 3000000
        })

        // Wait for the transaction to be mined
        const receipt = await transaction.wait()
        replyWithUpdatedMessage(ctx, `🌺 Successfuly sent <code>${formatNumber(amountInEther)} ${token.symbol}</code> to <code>${toAddress}</code>. You can check following details.`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}tx/${receipt.hash}`)], [{ text: '← Back', callback_data: `send_token_${id}` }]],
                resize_keyboard: true
            }
        })
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token?.deployer?.address, `send_token_${id}`, 'Error while Sending Token')
    }
}

export const estimateDeploymentCost = async (ctx: any, id: string) => {
    const CHAIN = CHAINS[CHAIN_ID]
    const launch = await Launches.findById(id)
    if (!launch) {
        ctx.reply(`⚠ There is no launch for this. Please check again`)
        return
    }
    try {
        ctx.reply(`🕐 Compiling contract...`)
        const { abi, bytecode, sourceCode } = (await compileContractForEstimation({
            chainId: CHAIN_ID,
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
        console.log('::succssfully complied')
        const _jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const _privteKey = decrypt(launch.deployer.key)
        const wallet = new Wallet(_privteKey, _jsonRpcProvider)

        // Get the nonce
        const nonce = await wallet.getNonce()
        // Calculate the contract address
        const contractAddress = ethers.getCreateAddress({
            from: wallet.address,
            nonce: nonce
        })
        // Create a contract factory
        const contractFactory = new ContractFactory(abi, bytecode, _jsonRpcProvider)
        // Get current gas price
        const gasPrice = (await _jsonRpcProvider.getFeeData()).maxFeePerGas
        // Estimate gas
        const deploymentTx = await contractFactory.getDeployTransaction()
        const deploymentFee = await _jsonRpcProvider.estimateGas(deploymentTx)
        console.log('deploymentFee', deploymentFee)

        // total deployment fee
        let deploymentCost = 0

        let approveFee = BigInt(0),
            addLpFee = BigInt(0)
        if (launch.autoLP || launch.instantLaunch) {
            const tokenAmount = parseEther(String(launch.totalSupply))
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20

            approveFee = await getApproveTransactionFee(CHAIN_ID, contractAddress, tokenAmount, _jsonRpcProvider)
            addLpFee = await getAddLpTransactionFee(CHAIN_ID, contractAddress, tokenAmount, launch.lpEth, deadline, wallet)

            deploymentCost += Number(process.env.FILTER_FEE_AMOUNT)
        }
        // Calculate deployment cost in ETH
        deploymentCost += Number(ethers.formatEther((BigInt(deploymentFee) + approveFee + addLpFee) * gasPrice))

        console.log(`Current gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`)
        console.log(`Estimated deployment cost: ${deploymentCost} ETH`)
        console.log('approveFee: ', approveFee)
        console.log('addLpFee: ', addLpFee)

        const text =
            `<b>*Estimated Gas Cost*</b>\n` +
            `<b>Deployer:</b> <code>${launch?.deployer?.address}</code>\n\n` +
            `<b>Current Price:</b> <code>${ethers.formatUnits(gasPrice, 'gwei')} gwei</code>\n` +
            `<b>ConctractDeployment Cost:</b> <code>${ethers.formatUnits(deploymentFee, 'gwei')} gwei</code>\n` +
            (launch.autoLP || launch.instantLaunch
                ? `<b>Approve Fee:</b> <code>${ethers.formatUnits(approveFee, 'gwei')} gwei</code>\n` +
                  `<b>AddLp Fee:</b> <code>${ethers.formatUnits(addLpFee, 'gwei')} gwei</code>\n` +
                  `<b>Lp Eth:</b> <code>${process.env.FILTER_FEE_AMOUNT} ETH</code>\n`
                : '') +
            `<b>Required Balance:</b> <code>${Number(deploymentCost)} ETH</code>\n`

        replyWithUpdatedMessage(ctx, text, {
            parse_mode: 'HTML',
            reply_markup: {
                one_time_keyboard: true,
                resize_keyboard: true,
                inline_keyboard: [[{ text: '← Back', callback_data: `manage_deployer_${id}` }]]
            }
        })
    } catch (err) {
        console.log(err)
        catchContractErrorException(ctx, err, CHAIN, launch.deployer.address, `manage_deployer_${id}`, `<b>Error: </b><code>${String(err).split(':')[1]}</code>`)
    }
}

export const predictContractAddress = async (ctx: any, id: string) => {
    const CHAIN = CHAINS[CHAIN_ID]
    const launch = await Launches.findById(id)
    try {
        const _jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        // const _privteKey = decrypt(launch.deployer.key);
        const _privteKey = decrypt(launch.deployer.key)
        const wallet = new Wallet(_privteKey, _jsonRpcProvider)

        // Get the nonce
        const nonce = await wallet.getNonce()

        // Calculate the contract address
        const contractAddress = ethers.getCreateAddress({
            from: wallet.address,
            nonce: nonce
        })

        const msg = `<b>This is the predicted contract address</b>\n` + `<code>${contractAddress}</code>\n\n` + `<i>Keep in mind that this address will change every time the deployer wallet sends a new transaction.</i>`
        replyWithUpdatedMessage(ctx, msg, {
            parse_mode: 'HTML',
            reply_markup: {
                one_time_keyboard: true,
                resize_keyboard: true,
                inline_keyboard: [[{ text: '← Back', callback_data: `manage_deployer_${id}` }]]
            }
        })
        return
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, launch.deployer.address, `manage_deployer_${id}`, `<b>Error: </b><code>${String(err).split(':')[1]}</code>`)
    }
}
