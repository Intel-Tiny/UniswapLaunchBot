import { CHAINS, CHAIN_ID } from '@/config/constant'
import Tokens from '@/models/Tokens'
import { catchContractErrorException, decrypt, replyWarningMessage, replyWithUpdatedMessage } from '@/share/utils'
import { Contract, JsonRpcProvider, Wallet, parseEther } from 'ethers'
import { Markup } from 'telegraf'

/**
 * controller for general settings
 * @param ctx
 * @param id
 * @returns
 */
export const feesSettingsMenu = async (ctx: any, id: string) => {
    const _token = await Tokens.findById(id)
    if (!_token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text =
        `<b>Fees Settings</b>\n` +
        `Use this menu to call all functions that are related to the Fees of <code>${_token.symbol}</code>.\n\n` +
        `<b>Update Fees</b> - Change the Buy/Sell Tax that is applied to all Swaps of your Token.\n` +
        `<b>Update Fee Threshold</b> - Change the Swap Threshold for your Token Tax. This is the value that determines the size of your Tax sells.\n (Ideally this should be decreased as your Market Capitalization increases to reduce the impact on your chart of your tax.)\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Update Fees', callback_data: `udpate_fees_${id}` },
                    { text: 'Update Fee Threshold', callback_data: `update_feeThreshold_${id}` }
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
export const udpateFeesMenu = async (ctx: any, id: string) => {
    const _token = await Tokens.findById(id)
    if (!_token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text =
        `<b>Update Fees</b>\n` +
        `Use this menu to change the Buy/Sell Fees that is applied to all Swaps of your Token.\n\n` +
        `Buy Fee+Liquidity Fee=Total Buy Fee.\n` +
        `Sell Fee+Liquidity Fee=Total Sell Fee.\n\n` +
        `<i>Note: Buy and Sell Fees cannot be higher than your initial.</i>`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `Buy Fee: ${_token?.buyFee}`, callback_data: `scene_contractBuyFeeEditScene_${id}` },
                    { text: `Sell Fee: ${_token?.sellFee}`, callback_data: `scene_contractSellFeeEditScene_${id}` }
                ],
                [{ text: `Liquidity Fee: ${_token?.liquidityFee}`, callback_data: `scene_contractLiquidityFeeEditScene_${id}` }],
                [
                    { text: '× Cancel', callback_data: `fees_settings_${id}` },
                    { text: '✔ Confirm', callback_data: `confirm_udpateFees_${id}` }
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
export const updateFeeThresholdMenu = async (ctx: any, id: string) => {
    const _token = await Tokens.findById(id)
    if (!_token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text =
        `<b>Update Threshold</b>\n` +
        `Use this menu to change the Swap Threshold for your Token Tax. This is the value that determines the size of your Tax sells.\n(Ideally this should be decreased as your Market Capitalization increases to reduce the impact on your chart of your tax.).\n\n` +
        `<b>Fee Threshold</b>- This is the amount of supply that needs to be in the contract address before it will swap for ETH.`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: `Swap Threshold: ${_token.swapThreshold} %`, callback_data: `scene_contractThresholdEditScene_${id}` }],
                [
                    { text: '× Cancel', callback_data: `fees_settings_${id}` },
                    { text: '✔ Confirm', callback_data: `confirm_updateFeeThreshold_${id}` }
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
export const updateFees = async (ctx: any, id: string) => {
    const { sellFee, buyFee, liquidityFee, deployer, abi, address, symbol } = await Tokens.findById(id)
    const CHAIN = CHAINS[CHAIN_ID]
    try {
        console.log('update fees')

        const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const privteKey = decrypt(deployer.key)
        const wallet = new Wallet(privteKey, jsonRpcProvider)
        const tokenContract = new Contract(address, abi, wallet)
        const owner = await tokenContract.owner()
        if (owner !== deployer.address) {
            replyWarningMessage(ctx, `⚠ This token's owner address is <code>${owner}</code>, You cannot run this transaction`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '← Back', callback_data: `udpate_fees_${id}` }]],
                    resize_keyboard: true
                }
            })
        } else {
            const feeData = await jsonRpcProvider.getFeeData()
            const tx = await tokenContract.setFees(Math.ceil(buyFee), Math.ceil(sellFee), Math.ceil(liquidityFee), {
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                maxFeePerGas: feeData.maxFeePerGas,
                gasLimit: 3000000
            })
            await tx.wait()
            replyWithUpdatedMessage(ctx, `🌺 Successfuly set new Fee settings of <code>${symbol}</code>. You can check following details.`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)], [{ text: '← Back', callback_data: `udpate_fees_${id}` }]],
                    resize_keyboard: true
                }
            })
        }
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, address, `udpate_fees_${id}`, 'Error while Updating Token Fees')
    }
}
/**
 * @param ctx
 * @param id
 * @returns
 */
export const updateFeeThreshold = async (ctx: any, id: string) => {
    const { swapThreshold, deployer, abi, address, symbol, totalSupply } = await Tokens.findById(id)
    const CHAIN = CHAINS[CHAIN_ID]
    try {
        const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const privteKey = decrypt(deployer.key)
        const wallet = new Wallet(privteKey, jsonRpcProvider)
        const tokenContract = new Contract(address, abi, wallet)
        const owner = await tokenContract.owner()
        if (owner !== deployer.address) {
            replyWarningMessage(ctx, `⚠ This token's owner address is <code>${owner}</code>, You cannot run this transaction`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: '← Back', callback_data: `fees_settings_${id}` }]],
                    resize_keyboard: true
                }
            })
        } else if (swapThreshold > 2 || swapThreshold < 0.001) {
            replyWarningMessage(ctx, `Swap Threshold must be greater than 0.001% and less than 2%.`)
        } else {
            const feeData = await jsonRpcProvider.getFeeData()
            const newThreshold = parseEther(String(totalSupply * swapThreshold * 0.01))
            const tx = await tokenContract.updateFeeTokenThreshold(newThreshold, {
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                maxFeePerGas: feeData.maxFeePerGas,
                gasLimit: 3000000
            })
            await tx.wait()
            replyWithUpdatedMessage(ctx, `🌺 Successfuly Set New FeeThreshold of <code>${symbol}</code>. Please check following details.`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)], [{ text: '← Back', callback_data: `fees_settings_${id}` }]],
                    resize_keyboard: true
                }
            })
        }
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, address, `fees_settings_${id}`, 'Error while Updating Swap Threshold')
    }
}
