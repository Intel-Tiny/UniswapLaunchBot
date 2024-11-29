import { CHAINS, CHAIN_ID } from '@/config/constant'
import Tokens from '@/models/Tokens'
import { capitalizeFirstLetter, catchContractErrorException, decrypt, replyWarningMessage, replyWithUpdatedMessage } from '@/share/utils'
import { Contract, JsonRpcProvider, Wallet } from 'ethers'
import { Markup } from 'telegraf'

/**
 * controller for general settings
 * @param ctx
 * @param id
 * @returns
 */
export const limitsSettings = async (ctx: any, id: string) => {
    const _token = await Tokens.findById(id)
    if (!_token) {
        return ctx.reply('⚠ There is no token for this id')
    }

    const CHAIN = CHAINS[CHAIN_ID]

    const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
    const tokenContract = new Contract(_token.address, _token.abi, jsonRpcProvider)

    const [maxSwap, maxWallet] = await Promise.all([tokenContract.maxSwapTxSize(), tokenContract.maxHoldings()])
    const _maxSwap = Number(maxSwap)
    const _maxWallet = Number(maxWallet)

    const text =
        `<b>Limits Settings</b>\n` +
        `Use this menu to call all functions that are related to the Limits of <code>${_token.symbol}</code>.\n\n` +
        `<b>Disable All Limits</b> - This will remove ALL limits with respect to your Token. This includes all of the below..\n` +
        `<b>Disable Holding Limits</b> - This will remove the limit on the Max Wallet for your Token. This means that there will be no limit to the size of a single wallet.\n` +
        `<b>Disable Swap Limit</b> - This will remove the limit on the Max Transaction for your Token. This means that there will be no limit to the size of a single Swap/Transaction involving your token.\n`

    const buttons = []
    if (_maxWallet > 0) {
        buttons.push({ text: '🧨 Disable Holding Limits', callback_data: `disable_holdingLimitsConfirm_${id}` })
    }
    if (_maxSwap > 0) {
        buttons.push({ text: '🧨 Disable Swap Limits', callback_data: `disable_swapLimitsConfirm_${id}` })
    }

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                _maxSwap > 0 || _maxWallet > 0 ? [{ text: '🚫 Disable All Limits', callback_data: `disable_allLimitsConfirm_${id}` }] : [{ text: '🚫 All limits already disabled', callback_data: `#` }],
                buttons,
                [{ text: '← Back', callback_data: `manage_token_${id}` }]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

/**
 * @param ctx
 * @param id
 * @returns
 */
export const disableAllLimitsConfirm = async (ctx: any, id: string) => {
    const text = `<b>Disable All Limits</b>\n` + `This will remove ALL limits with respect to your Token. Cannot revert it\n\n`
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '❌ Cancel', callback_data: `limits_settings_${id}` },
                    { text: 'Disable All', callback_data: `disable_allLimits_${id}` }
                ]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}
/**
 * @param ctx
 * @param id
 * @returns
 */
export const disableHoldingLimitsMenu = async (ctx: any, id: string) => {
    const text = `<b>Disable Holding Limits</b>\n` + `This will remove Holding limits with respect to your Token. Cannot revert it\n\n`
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '❌ Cancel', callback_data: `limits_settings_${id}` },
                    { text: 'Disable', callback_data: `disable_holdingLimits_${id}` }
                ]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}
/**
 * @param ctx
 * @param id
 * @returns
 */
export const disableSwapLimitsMenu = async (ctx: any, id: string) => {
    const _token = await Tokens.findById(id)
    if (!_token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text = `<b>Disable Swap Limits</b>\n` + `This will remove Swap limits with respect to your Token. Cannot revert it\n\n`
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '❌ Cancel', callback_data: `limits_settings_${id}` },
                    { text: 'Disable', callback_data: `disable_swapLimits_${id}` }
                ]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

/**
 * @param ctx
 * @param id
 * @returns
 */
export const disableAllLimits = async (ctx: any, id: string) => {
    const token = await Tokens.findById(id)
    const CHAIN = CHAINS[CHAIN_ID]

    try {
        const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const privteKey = decrypt(token.deployer.key)
        const wallet = new Wallet(privteKey, jsonRpcProvider)
        const tokenContract = new Contract(token.address, token.abi, wallet)
        const owner = await tokenContract.owner()
        if (owner !== token.deployer.address) {
            replyWarningMessage(ctx, `⚠ This token's owner address is <code>${owner}</code>, You cannot run this transaction`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '← Back', callback_data: `limits_settings_${id}` }]],
                    resize_keyboard: true
                }
            })
        } else {
            const feeData = await jsonRpcProvider.getFeeData()
            const tx = await tokenContract.removeLimits({
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                maxFeePerGas: feeData.maxFeePerGas,
                gasLimit: 3000000
            })
            await tx.wait()
            await Tokens.findOneAndUpdate({ _id: id }, { maxWallet: 0, maxSwap: 0 })
            replyWithUpdatedMessage(ctx, `🌺 Successfully  Disabled all limits of <code>${token.symbol}</code>, You cannot set limits again.`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)], [{ text: '← Back', callback_data: `limits_settings_${id}` }]],
                    resize_keyboard: true
                }
            })
        }
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token.address, `limits_settings_${id}`, 'Error while disabling All Limits')
    }
}
/**
 * @param ctx
 * @param id
 * @returns
 */
export const disableHoldingLimits = async (ctx: any, id: string) => {
    const token = await Tokens.findById(id)
    const CHAIN = CHAINS[CHAIN_ID]

    try {
        const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const privteKey = decrypt(token.deployer.key)
        const wallet = new Wallet(privteKey, jsonRpcProvider)
        const tokenContract = new Contract(token.address, token.abi, wallet)
        const owner = await tokenContract.owner()
        if (owner !== token.deployer.address) {
            replyWarningMessage(ctx, `⚠ This token's owner address is <code>${owner}</code>, You cannot run this transaction`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '← Back', callback_data: `limits_settings_${id}` }]],
                    resize_keyboard: true
                }
            })
        } else {
            const feeData = await jsonRpcProvider.getFeeData()
            const tx = await tokenContract.disableWalletLimit({
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                maxFeePerGas: feeData.maxFeePerGas,
                gasLimit: 3000000
            })
            await tx.wait()
            await Tokens.findOneAndUpdate({ _id: id }, { maxWallet: 0 })

            replyWithUpdatedMessage(ctx, `🌺 Successfully Disabled Holding limits of <code>${token.symbol}</code>, You cannot set holding limits again`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)], [{ text: '← Back', callback_data: `limits_settings_${id}` }]],
                    resize_keyboard: true
                }
            })
        }
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token.address, `limits_settings_${id}`, 'Error while disabling HoldingLimits')
    }
}
/**
 * @param ctx
 * @param id
 * @returns
 */
export const disableSwapLimits = async (ctx: any, id: string) => {
    const token = await Tokens.findById(id)
    const CHAIN = CHAINS[CHAIN_ID]

    try {
        const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const privteKey = decrypt(token.deployer.key)
        const wallet = new Wallet(privteKey, jsonRpcProvider)
        const tokenContract = new Contract(token.address, token.abi, wallet)
        const owner = await tokenContract.owner()
        if (owner !== token.deployer.address) {
            replyWarningMessage(ctx, `⚠ This token's owner address is <code>${owner}</code>, You cannot run this transaction`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '← Back', callback_data: `limits_settings_${id}` }]],
                    resize_keyboard: true
                }
            })
        } else {
            const feeData = await jsonRpcProvider.getFeeData()
            const tx = await tokenContract.removeMaxSwap({
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                maxFeePerGas: feeData.maxFeePerGas,
                gasLimit: 3000000
            })
            await tx.wait()
            await Tokens.findOneAndUpdate({ _id: id }, { maxSwap: 0 })

            replyWithUpdatedMessage(ctx, `🌺 Successfully Disabled Swap limits of <code>${token.symbol}</code>, You cannot set swap limits again`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)], [{ text: '← Back', callback_data: `limits_settings_${id}` }]],
                    resize_keyboard: true
                }
            })
        }
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token.address, `limits_settings_${id}`, 'Error while disabling Swap Limits')
    }
}
