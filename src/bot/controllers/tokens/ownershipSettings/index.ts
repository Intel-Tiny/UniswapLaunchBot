import Tokens from '@/models/Tokens'
import { CHAINS, CHAIN_ID } from '@/config/constant'
import { catchContractErrorException, decrypt, replyWarningMessage, replyWithUpdatedMessage } from '@/share/utils'
import { Contract, JsonRpcProvider, Wallet } from 'ethers'
import { Markup } from 'telegraf'

/**
 * controller for general settings
 * @param ctx
 * @param id
 * @returns
 */
export const ownershipSetting = async (ctx: any, id: string) => {
    const _token = await Tokens.findById(id)
    if (!_token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text =
        `<b>Ownership Settings</b>\n` +
        `Use this menu to call all functions that are related to the Ownership of <code>${_token.symbol}</code>.\n\n` +
        `<b>Transfer Ownership</b> - Give ownership of the contract to another address. This is PERMANENT.\n` +
        `<b>Renounce Ownership</b> - Renounce ownership of the contract and ensure that no functions can be called from this moment forward. Double check that all parameters are satisfactory before renouncing your contract as this is PERMANENT.\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Transfer Ownership', callback_data: `transfer_ownership_${id}` },
                    { text: 'Renounce Ownership', callback_data: `renounce_ownership_${id}` }
                ],
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
export const transferOwnershipConfirm = async (ctx: any, id: string) => {
    const newOwner = ctx.session.newOwner
    const _token = await Tokens.findById(id)
    if (!_token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text = `<b>Transfer Ownership</b>\n` + `Use this to transfer ownership of the token to another address.\n\n`
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: `New Owner: ${newOwner ?? 'Unset'}`, callback_data: `scene_contractNewOwnerEditScene_${id}` }],
                [
                    { text: '❌ Cancel', callback_data: `manage_token_${id}` },
                    { text: 'Transfer', callback_data: `confirm_transferOwnership_${id}` }
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
export const renounceOwnershipConfirm = async (ctx: any, id: string) => {
    const _token = await Tokens.findById(id)
    if (!_token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text = `<b>Renounce Ownership</b>\n` + `Renounce ownership of the contract and ensure that no functions can be called from this moment forward. \n\n`
    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '❌ Cancel', callback_data: `manage_token_${id}` },
                    { text: 'Renounce', callback_data: `confirm_renounceOwnership_${id}` }
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
export const transferOwnership = async (ctx: any, id: string) => {
    const newOwner = ctx.session.newOwner

    if (!newOwner) {
        replyWarningMessage(ctx, '⚠ No new owner')
    }

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
                    inline_keyboard: [[{ text: '← Back', callback_data: `manage_token_${id}` }]],
                    resize_keyboard: true
                }
            })
        } else {
            const feeData = await jsonRpcProvider.getFeeData()
            const tx = await tokenContract.transferOwnership(newOwner, {
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                maxFeePerGas: feeData.maxFeePerGas,
                gasLimit: 3000000
            })
            await tx.wait()

            replyWithUpdatedMessage(ctx, `🌺 <code>${newOwner}</code>\nhas been set as new owner of ${token.symbol}`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)], [{ text: '← Back', callback_data: `manage_token_${id}` }]],
                    resize_keyboard: true
                }
            })
        }
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token.address, `ownership_settings_${id}`, 'Error while Transferring Ownership')
    }
}
/**
 * @param ctx
 * @param id
 * @returns
 */
export const renounceOwnership = async (ctx: any, id: string) => {
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
                    inline_keyboard: [[{ text: '← Back', callback_data: `manage_token_${id}` }]],
                    resize_keyboard: true
                }
            })
        } else {
            const feeData = await jsonRpcProvider.getFeeData()
            const tx = await tokenContract.renounceOwnership({
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                maxFeePerGas: feeData.maxFeePerGas,
                gasLimit: 3000000
            })
            await tx.wait()
            replyWithUpdatedMessage(ctx, `🌺 You have renounced your ownership of ${token.symbol}`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)], [{ text: '← Back', callback_data: `manage_token_${id}` }]],
                    resize_keyboard: true
                }
            })
        }
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token.address, `ownership_settings_${id}`, 'Error while Renouncing Ownership')
    }
}
