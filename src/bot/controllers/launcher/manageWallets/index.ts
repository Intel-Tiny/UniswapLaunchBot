import { CHAIN_ID, CHAINS } from '@/config/constant'
import Launches from '@/models/Launch'
import Tokens from '@/models/Tokens'
import { catchContractErrorException, decrypt, encrypt, formatNumber, formatSmallNumber, replyWithUpdatedMessage, saveOldMsgIds, showMessage } from '@/share/utils'
import { ethers, formatEther, isAddress, JsonRpcProvider, parseEther, Wallet, Contract, getCreateAddress } from 'ethers'
import fs from 'fs'
import { emptyWallet } from '@/share/utils'
import { Markup } from 'telegraf'
import RouterABI from '@/constants/ABI/routerABI.json'
import { getBundledWalletTransactionFee } from '@/share/token'

export const manageWallets = async (ctx: any, id: string) => {
    showMessage(ctx, '⏰ Loading Wallets...')

    const CHAIN = CHAINS[CHAIN_ID]
    const provider = new JsonRpcProvider(CHAIN.RPC)
    // if isToken, get from Tokens, else get from Launches
    const isToken = id && id?.startsWith('token')
    const launch = id ? (isToken ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    let contractAddress = ''
    let tokenContract: Contract
    if (isToken) {
        //@ts-ignore
        contractAddress = launch?.address
        //@ts-ignore
        const abi = launch.abi
        const privteKey = decrypt(launch.deployer.key)
        const wallet = new Wallet(privteKey, provider)
        tokenContract = new Contract(contractAddress, abi, wallet)
    }
    const { bundledWallets, lpEth, maxBuy } = launch
    ctx.session.currentTag = 'manageWallet'

    let requiredEthPerWallet = maxBuy * lpEth * 0.01
    requiredEthPerWallet = Number(requiredEthPerWallet)
    const totalRequired = bundledWallets.length * requiredEthPerWallet

    let text =
        `*Bundled Wallets*\n` +
        `Create, Import, and Delete Wallets that will be used with your WAGYU launch.\n` +
        `<i>Funds can be added to Wallets at a later stage</i>\n\n` +
        `<b><u>Wallets will only save when the “Back” button is pressed.</u></b> \n\n` +
        `<b>Create Wallet</b> –   Add a new address to your Bundled Wallets. Please remember to save the private key when it is provided.\n` +
        `<b>Import Wallet</b> – Import an existing address to your Bundled Wallets. You will need your Private Key for importing. \n` +
        `<b>Distribute Token</b> – Send token from your deployer wallet to another address. \n\n` +
        `<b>Send Token</b> – Send token from one of your bundled wallets to another address. \n\n` +
        `<b>Delete Wallet</b> – Delete an address from your Bundled Wallets. \n\n` +
        `<b>Send ETH</b> – Select a Wallet and Transfer its ETH to another Address. \n` +
        // `<b>Wallets Disperse List</b> – Request a.txt file of the required amounts for your Wallet operation. \n\n` +
        `<b>Total Required</b> – ${formatSmallNumber(totalRequired)} ETH \n\n`

    const wallets = await Promise.all(
        bundledWallets.map(async (_wallet: { address: string; key: string }, i: number) => {
            const walletAddress = bundledWallets[i].address
            let tokenBalance = 0
            console.log('walletAddress: ' + walletAddress)
            if (contractAddress != '') {
                const _balance = await tokenContract.balanceOf(walletAddress)
                tokenBalance = Number(formatEther(_balance))
                console.log('tokenBalance: ' + tokenBalance)
            }
            try {
                // Get the balance in wei
                const balanceWei = await provider.getBalance(walletAddress)
                // Convert wei to ether
                const balanceEth = ethers.formatEther(balanceWei)
                // const tokenBalance = await
                return `🔹 <b>Wallet#${i + 1}</b> 🔹 \n  <code>${walletAddress}</code>\n   <i>*Required:</i> <code>${requiredEthPerWallet} ETH</code> \n   <i>*Balance:</i> <code>${Number(balanceEth)} ETH</code>\n   ${isToken ? `<i>*Token Balance:</i> <code>${Number(tokenBalance)} ${launch.symbol} </code>` : ''}\n\n`
            } catch (err) {
                return `🔹 <b>Wallet#${i + 1}</b> 🔹 \n  <code>${walletAddress}</code>\n   <i>*Required:</i> <code>${requiredEthPerWallet} ETH</code> \n   <i>*Balance:</i> <code>0 ETH</code>\n   ${isToken ? `<i>*Token Balance:</i> <code>0 ${launch.symbol}</code>` : ''}\n\n`
            }
        })
    )

    text += wallets.reduce((msg: string, text: string) => msg + text, '')

    let back = []

    if (id) {
        if (ctx.session.tagTitle == 'wallets') {
            back.push({ text: '←️ Back', callback_data: `wallets` })
        } else if (id.startsWith('token')) {
            back.push({ text: '←️ Back', callback_data: `manage_token_${id.substr(5)}` })
        } else {
            back.push({ text: '←️ Back', callback_data: `manage_launch_${id}` })
        }
    } else {
        back.push({ text: '←️ Back', callback_data: 'bundled_wallets_' })
    }

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            one_time_keyboard: true,
            inline_keyboard: [
                back,
                [
                    { text: '✔️ Create Wallet(s) ', callback_data: `manage_createWallets_${id}` },
                    { text: '🔗 Import Wallet(s) ', callback_data: `scene_importWalletScene_${id}` },
                    { text: '✖️ Delete Wallet(s) ', callback_data: `scene_deleteWalletScene_${id}` }
                ],
                isToken
                    ? [
                          // { text: '📜 Wallet Disperse List ', callback_data: `manage_walletDisperse_${id}` },
                          { text: '📤 Distribute Token', callback_data: `send_tokenDeployer_${id}` },
                          { text: '📤 Send ETH ', callback_data: `send_ethWallet_${id}` }
                      ]
                    : [
                          // { text: '📜 Wallet Disperse List ', callback_data: `manage_walletDisperse_${id}` },
                          { text: '📤 Send ETH ', callback_data: `send_ethWallet_${id}` }
                      ],
                isToken
                    ? [
                          { text: '🚀 Send Token', callback_data: `send_tokenWallet_${id}` },
                          { text: '🗑 Empty All Wallets', callback_data: `manage_emptyWallets_${id}` }
                      ]
                    : [{ text: '🗑 Empty All Wallets', callback_data: `manage_emptyWallets_${id}` }]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

export const createWallets = async (ctx: any, id: string, flag: boolean = false) => {
    const walletAmount = ctx.session.createWalletAmount || 1
    const text =
        `<b>Wallet Generation (Max: 40)</b>\n` + `This tool will generate a new wallets for your bundle. \n\n` + `<b><u>Please note that the private keys cannot be downloaded or viewed ever again, so make sure to save them in a secure place.</u></b>`
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: `Amount: ${walletAmount}`, callback_data: `scene_createWalletAmountScene_${id}` }],
                [
                    { text: '✖️ Cancel', callback_data: `manage_wallets_${id}` },
                    { text: `${flag === true ? '✔ Save' : '✨ Generate'}`, callback_data: `${flag === true ? `save_createWallet_${id}` : `generate_createWallet_${id}`}` }
                ]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

export const generateWallets = async (ctx: any, id: string) => {
    const launch = id ? (id.startsWith('token') ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    const wallets: { address: string; key: string }[] = launch?.bundledWallets ?? []
    const walletAmount = Number(ctx.session.createWalletAmount || 1)

    //check wallet count
    const { maxBuy, lpSupply, bundledWallets } = launch
    const maxWallets = Math.floor(lpSupply / maxBuy)

    if (bundledWallets.length + walletAmount > maxWallets) {
        await ctx.answerCbQuery(
            `⚠ Your bundled wallet has been exceeded.\n Your current LP supply is ${lpSupply}% and Max Buy is ${maxBuy}%. Therefore, a maximum of ${maxWallets} wallets are available and ${maxWallets - bundledWallets.length} additional wallets can be created.`,
            { show_alert: true }
        )
    } else {
        let walletInfo = ''
        for (let i = 0; i < walletAmount; i++) {
            const wallet = Wallet.createRandom()
            walletInfo += `wallet-#${i + 1} - ${wallet.address} \nPrivate Key: ${wallet.privateKey} \n\n`
            wallets.push({
                address: wallet.address,
                key: encrypt(wallet.privateKey)
            })
        }
        ctx.session.bundledWallets = wallets
        // Create a temporary file with wallet information
        const fileName = `wallet_${Date.now()}.txt`
        fs.writeFileSync(fileName, walletInfo)
        await createWallets(ctx, id, true)
        // Send the file to the user
        const { message_id } = await ctx.replyWithDocument(
            { source: fileName },
            {
                caption: 'Here are your wallets and their private keys. Make sure to save them in a secure place.',
                // reply_to_message_id: ctx.message.message_id, // Reply to the user's command message
                parse_mode: 'HTML',
                disable_notification: true
            }
        )
        saveOldMsgIds(ctx, message_id)
        // Delete the temporary file
        fs.unlinkSync(fileName)
    }
}

export const saveWallets = async (ctx: any, id: string) => {
    const launch = id ? (id.startsWith('token') ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    const { maxBuy, lpSupply } = launch

    const maxWallets = Math.floor(lpSupply / maxBuy)
    const bundledWallets = ctx.session.bundledWallets
    // check max wallet count
    if (bundledWallets.length > maxWallets) {
        await ctx.answerCbQuery(
            `⚠ Your bundled wallet has been exceeded.\n Your current LP supply is ${lpSupply}% and Max Buy is ${maxBuy}%. Therefore, a maximum of ${maxWallets} wallets are available and ${maxWallets - bundledWallets.length} additional wallets can be created.`,
            { show_alert: true }
        )
    } else {
        if (id) {
            // in the case of management
            if (id.startsWith('token')) {
                await Tokens.findByIdAndUpdate(id.substr(5), { bundledWallets })
            } else {
                await Launches.findByIdAndUpdate(id, { bundledWallets })
            }
        } else {
            // when creating launch
            await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, { bundledWallets }, { new: true, upsert: true })
        }
    }
    await manageWallets(ctx, id)
}

export const sendEthWallet = async (ctx: any, id: string) => {
    const launch = id ? (id.startsWith('token') ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })

    const CHAIN = CHAINS[CHAIN_ID]
    const provider = new JsonRpcProvider(CHAIN.RPC)
    const deployerAddress = launch.deployer?.address || ''

    if (!deployerAddress) {
        await ctx.answerCbQuery(`⚠ You must create or link deployer first to send ETH to bundled wallets`, { show_alert: true })
        return
    }
    // Get the balance in wei
    const balanceWei = await provider.getBalance(deployerAddress)

    const receiverAddress = ctx.session?.ethReceiveAddress
    const amount = ctx.session?.ethReceiverAmount
    console.log('receiverAddress:amount', receiverAddress, amount)

    const text =
        `<b>Send ETH</b>\n` +
        `Use this menu to send ETH from your deployer. You can send specific amount of ETH from your deployer wallet to one of your bundled wallets.\n\n` +
        `▰ <a href='${CHAIN.explorer}/address/${deployerAddress}'>deployer</a> ▰\n` +
        `<code>${deployerAddress}</code>\n` +
        `Balance: <code>${Number(formatEther(balanceWei))} ETH </code>\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            one_time_keyboard: true,
            resize_keyboard: true,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            inline_keyboard: [
                [
                    { text: `Receiver: ${receiverAddress ? receiverAddress : 'Unset'}`, callback_data: `scene_walletToAddressEditScene_${id}` },
                    { text: `Amount: ${amount ? amount : '0.0'} ETH`, callback_data: `scene_walletSendAmountEditScene_${id}` }
                ],
                [
                    { text: '← Back', callback_data: `manage_wallets_${id}` },
                    { text: '📤 Send ETH', callback_data: `sendEth_confirmWallet_${id}` }
                ]
            ]
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

export const sendEthConfirmWallet = async (ctx: any, id: string) => {
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
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_ethWallet_${id}` }]]
                }
            })
            return
        }
        const amountWei = parseEther(amountInEther.toFixed(18))
        console
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
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_ethWallet_${id}` }]]
                }
            })
            return
        }

        // Create the transaction object
        const toAddress = ctx.session?.ethReceiveAddress
        // receiver checking
        if (!isAddress(toAddress)) {
            replyWithUpdatedMessage(ctx, `<b>⚠ Invalid ETH address\n</b><code>${toAddress}</code> must be valid ETH address.`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_ethWallet_${id}` }]]
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
                inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${receipt.hash}`)], [{ text: '← Back', callback_data: `manage_wallets_${id}` }]],
                resize_keyboard: true
            }
        })
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, launch?.deployer?.address, `send_ethWallet_${id}`, 'Error while Sending ETH')
    }
}

export const sendTokenDeployer = async (ctx: any, id: string) => {
    const token = await Tokens.findById(id.substr(5))

    if (!token) {
        replyWithUpdatedMessage(ctx, `⚠ Cannot find Token for this Id. Please try again`, {
            parse_mode: 'HTML',
            reply_markup: {
                resize_keyboard: true,
                inline_keyboard: [[{ text: '← Back', callback_data: `manage_wallets_${id}` }]]
            }
        })
        return
    }

    const { address, abi } = token

    const CHAIN = CHAINS[CHAIN_ID]
    const provider = new JsonRpcProvider(CHAIN.RPC)
    const privteKey = decrypt(token.deployer.key)
    const wallet = new Wallet(privteKey, provider)
    const tokenContract = new Contract(address, abi, wallet)
    // get token balance of deployer wallet
    const balance = await tokenContract.balanceOf(token.deployer.address)

    const receiverAddress = ctx.session?.tokenReceiverAddress
    const amount = ctx.session?.tokenReceiverAmount
    console.log('receiverAddress:amount', receiverAddress, amount)

    const text =
        `<b>Send Token</b>\n` +
        `Use this menu to send Token from your deployer wallet. You can send specific amount of Token from your deployer wallet to one of your wallets.\n\n` +
        `▰ <a href='${CHAIN.explorer}/address/${token?.deployer?.address}'>deployer</a> ▰\n` +
        `<code>${token?.deployer?.address}</code>\n` +
        `Balance: <code>${formatNumber(formatEther(balance))} ${token.symbol} </code>\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            one_time_keyboard: true,
            resize_keyboard: true,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            inline_keyboard: [
                [
                    { text: `Receiver: ${receiverAddress ? receiverAddress : 'Unset'}`, callback_data: `scene_tokenToAddressEditScene_${id}` },
                    { text: `Amount: ${amount ? amount : '0.0'} ${token.symbol}`, callback_data: `scene_tokenSendAmountEditScene_${id}` }
                ],
                [
                    { text: '← Back', callback_data: `manage_wallets_${id}` },
                    { text: '📤 Send Token', callback_data: `sendTokenDeployer_confirm_${id}` }
                ]
            ]
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

export const sendTokenDeployerConfirm = async (ctx: any, id: string) => {
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
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_tokenDeployer_${id}` }]]
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
            replyWithUpdatedMessage(ctx, `<b>⚠ You don't have enough Tokens in your deployer wallet\n</b>Required <code>${amountInEther}ETH</code>, but has only <code>${_tokenBalanceInEther}ETH</code>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_tokenDeployer_${id}` }]]
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
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_tokenDeployer_${id}` }]]
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
                inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}tx/${receipt.hash}`)], [{ text: '← Back', callback_data: `send_tokenDeployer_${id}` }]],
                resize_keyboard: true
            }
        })
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token?.deployer?.address, `send_tokenDeployer_${id}`, 'Error while Sending Token')
    }
}

export const sendTokenWallet = async (ctx: any, id: string) => {
    const token = await Tokens.findById(id.substr(5))

    if (!token) {
        replyWithUpdatedMessage(ctx, `⚠ Cannot find Token for this Id. Please try again`, {
            parse_mode: 'HTML',
            reply_markup: {
                resize_keyboard: true,
                inline_keyboard: [[{ text: '← Back', callback_data: `manage_wallets_${id}` }]]
            }
        })
        return
    }

    const { bundledWallets, symbol } = token

    const senderAddress = ctx.session?.tokenSenderAddress
    const receiverAddress = ctx.session?.tokenReceiverAddress
    const amount = ctx.session?.tokenReceiverAmount
    console.log('senderAddress:receiverAddress:amount', senderAddress, receiverAddress, amount)

    const bundledWallet = bundledWallets.find((w: { address: string; key: string }) => w.address === senderAddress)

    if (!senderAddress) {
        const settings = {
            parse_mode: 'HTML',
            reply_markup: {
                one_time_keyboard: true,
                resize_keyboard: true,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
                inline_keyboard: [
                    [{ text: `From: ${senderAddress ? senderAddress : 'Unset'}`, callback_data: `scene_walletFromEditScene_${id}` }],
                    [
                        { text: `Receiver: ${receiverAddress ? receiverAddress : 'Unset'}`, callback_data: `scene_walletToEditScene_${id}` },
                        { text: `Amount: ${amount ? amount : '0.0'} ${symbol}`, callback_data: `scene_walletAmountEditScene_${id}` }
                    ],
                    [{ text: '← Back', callback_data: `manage_wallets_${id}` }]
                ]
            }
        }
        const text = `<b>Send ${symbol}</b>\n` + `Use this menu to send Token from your one of your bundled wallet. You can send specific amount of Token from your deployer wallet to one of your wallets.`
        replyWithUpdatedMessage(ctx, text, settings)
    } else if (!bundledWallet) {
        const text =
            `<b>Send ${symbol}</b>\n` +
            `Use this menu to send Token from your one of your bundled wallet. You can send specific amount of Token from your deployer wallet to one of your wallets.\n\n<code>${senderAddress}</code> is not your bundled wallet, Please enter one of your bundeld wallets`
        const settings = {
            parse_mode: 'HTML',
            reply_markup: {
                one_time_keyboard: true,
                resize_keyboard: true,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
                inline_keyboard: [
                    [{ text: `From: ${senderAddress ? senderAddress : 'Unset'}`, callback_data: `scene_walletFromEditScene_${id}` }],
                    [
                        { text: `Receiver: ${receiverAddress ? receiverAddress : 'Unset'}`, callback_data: `scene_walletToEditScene_${id}` },
                        { text: `Amount: ${amount ? amount : '0.0'} ${symbol}`, callback_data: `scene_walletAmountEditScene_${id}` }
                    ],
                    [{ text: '← Back', callback_data: `manage_wallets_${id}` }]
                ]
            }
        }
        replyWithUpdatedMessage(ctx, text, settings)
    } else {
        console.log('we can now send token here:::::')
        const contractAddress = token.address
        const abi = token.abi
        const privteKey = decrypt(bundledWallet.key)
        const CHAIN = CHAINS[CHAIN_ID]
        const provider = new JsonRpcProvider(CHAIN.RPC)
        const wallet = new Wallet(privteKey, provider)
        const tokenContract = new Contract(contractAddress, abi, wallet)
        const balance = await tokenContract.balanceOf(senderAddress)

        const text =
            `<b>Send ${symbol}</b>\n` +
            `Use this menu to send Token from your one of your bundled wallet. You can send specific amount of Token from your deployer wallet to one of your wallets.\n\n` +
            `▰ <a href='${CHAIN.explorer}/address/${senderAddress}'>sender address</a> ▰\n` +
            `<code>${senderAddress}</code>\n` +
            `Balance: <code>${formatNumber(formatEther(balance))} ${token.symbol} </code>\n`

        const settings = {
            parse_mode: 'HTML',
            reply_markup: {
                one_time_keyboard: true,
                resize_keyboard: true,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
                inline_keyboard: [
                    [{ text: `From: ${senderAddress ? senderAddress : 'Unset'}`, callback_data: `scene_walletFromEditScene_${id}` }],
                    [
                        { text: `Receiver: ${receiverAddress ? receiverAddress : 'Unset'}`, callback_data: `scene_walletToEditScene_${id}` },
                        { text: `Amount: ${amount ? amount : '0.0'} ${symbol}`, callback_data: `scene_walletAmountEditScene_${id}` }
                    ],
                    [
                        { text: '← Back', callback_data: `manage_wallets_${id}` },
                        { text: '📤 Send Token', callback_data: `sendTokenWallet_confirm_${id}` }
                    ]
                ]
            }
        }

        replyWithUpdatedMessage(ctx, text, settings)
    }
}

export const sendTokenWalletConfirm = async (ctx: any, id: string) => {
    ctx.session.mainMsgId = undefined
    const token = await Tokens.findById(id.substr(5))
    const CHAIN = CHAINS[CHAIN_ID]

    try {
        // Convert the amount from ether to wei
        const amountInEther = Number(ctx.session?.tokenReceiverAmount)
        console.log('amountInEther: ', amountInEther)
        if (isNaN(amountInEther)) {
            replyWithUpdatedMessage(ctx, `⚠ Invalid Token amount to send. Please try again after checking.`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_tokenWallet_${id}` }]]
                }
            })
            return
        }
        const amountWei = ethers.parseEther(amountInEther.toFixed(18))
        // Get the balance in wei
        await ctx.reply(`⏰ Checking Balance...`)
        // contract
        const senderAddress = ctx.session?.tokenSenderAddress
        const bundledWallet = token.bundledWallets.find((w: { address: string; key: string }) => w.address === senderAddress)
        const provider = new JsonRpcProvider(CHAIN.RPC)
        const privateKey = decrypt(bundledWallet.key)
        const wallet = new Wallet(privateKey, provider)

        const contract = new Contract(token.address, token.abi, wallet)
        const _tokenBalance = await contract.balanceOf(senderAddress)
        const _tokenBalanceInEther = formatEther(_tokenBalance)
        //balance checking
        if (Number(_tokenBalanceInEther) < Number(amountInEther)) {
            replyWithUpdatedMessage(ctx, `<b>⚠ You don't have enough Tokens in your sender wallet\n</b>Required <code>${amountInEther} ${token.symbol}</code>, but has only <code>${_tokenBalanceInEther} ${token.symbol}</code>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    one_time_keyboard: true,
                    resize_keyboard: true,
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_tokenWallet_${id}` }]]
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
                    inline_keyboard: [[{ text: '← Back', callback_data: `send_tokenWallet_${id}` }]]
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
                inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}tx/${receipt.hash}`)], [{ text: '← Back', callback_data: `send_tokenWallet_${id}` }]],
                resize_keyboard: true
            }
        })
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token?.deployer?.address, `send_tokenWallet_${id}`, 'Error while Sending Token')
    }
}

export const emptyAllWallets = async (ctx: any, id: string) => {
    ///need to write code here

    const launch = id ? (id.startsWith('token') ? await Tokens.findById(id.substr(5)) : await Launches.findById(id)) : await Launches.findOneAndUpdate({ userId: ctx.chat.id, enabled: false }, {}, { new: true, upsert: true })
    const CHAIN = CHAINS[CHAIN_ID]
    showMessage(ctx, '⏰ Sending Eth to deployer...')
    const { bundledWallets, deployer } = launch
    await Promise.all(bundledWallets.map((w: { address: string; key: string }) => emptyWallet(w.key, deployer.address)))
    manageWallets(ctx, id)

    return 1
}
