import { CHAINS, CHAIN_ID } from '@/config/constant'
import Tokens from '@/models/Tokens'
import { catchContractErrorException, decrypt, formatNumber, localeNumber, replyWithUpdatedMessage } from '@/share/utils'
import { Contract, JsonRpcProvider, Wallet, formatEther, parseEther } from 'ethers'
import RouterABI from '@/constants/ABI/routerABI.json'
import { Markup } from 'telegraf'
import ERC20ABI from '@/constants/ABI/ERC20.json'

/**
 * menu for liquidity settings
 * @param ctx
 * @param id
 * @returns
 */
export const lpSettingsMenu = async (ctx: any, id: string) => {
    const _token = await Tokens.findById(id)
    if (!_token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text =
        `<b>💦 Liquidity Management</b>\n` +
        `Use this menu to manage the liquidity of <code>${_token.symbol}</code>.\n\n` +
        `<b>Add Liquidity</b> - This will allow you to add liquidity to your token.\n` +
        // `<b>Remove Liquidity</b> - This will allow you to remove liquidity from your token.\n` +
        // `<b>Lock Liquidity</b> - This will allow you to lock liquidity through Team Finance or Unicrypt. (This is the recommended method for locking liquidity.)\n` +
        `<b>Burn Liquidity</b> - This will burn your wished amount of liquidity tokens.\n`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '+ Add Liquidity', callback_data: `add_liquidity_${id}` }],
                [
                    // { text: '🔐 Lock Liquidity', callback_data: `lock_liquidity_${id}` },
                    { text: '🧹 Remove Liquidity', callback_data: `remove_liquidity_${id}` },
                    { text: '🔥 Burn Liquidity', callback_data: `burn_liquidity_${id}` }
                ],
                [{ text: '← Back', callback_data: `manage_token_${id}` }]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

/**
 * menu for adding lp
 * @param ctx
 * @param id
 * @returns
 */
export const addLiquidityMenu = async (ctx: any, id: string) => {
    const token = await Tokens.findById(id)
    if (!token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const text =
        `<b>Liquidity Adding [$<code>${token.symbol}</code>]</b>\n` +
        `Use this menu to create a liquidity pair and/or add liquidity.\n\n` +
        `💦 Pool Information.\n` +
        `<b>* Token A:</b>  <code>${formatNumber(token.totalSupply * token.lpSupply * 0.01)} ${token.symbol}</code>\n` +
        `<b>* Token B:</b>  <code>${formatNumber(token.lpEth)} ETH</code>\n\n` +
        `<b>- Summary -</b>\n` +
        `<code>${token.lpSupply}%</code> of your total supply will be added to the pool along with <code>${formatNumber(token.lpEth)} ETH</code>.\n` +
        `<i>This can only be changed previously to deploying your token.</i>`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: token.lpAdded
                ? [[{ text: '=== Liquidity Already Added ===', callback_data: `#` }], [{ text: '← Back', callback_data: `lp_settings_${id}` }]]
                : [
                      [
                          { text: '× Cancel', callback_data: `lp_settings_${id}` },
                          { text: '+ Add Liquidity', callback_data: `confirm_addLiquidity_${id}` }
                      ]
                  ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

/**
 * menu for burning lp
 * @param ctx
 * @param id
 * @returns
 */
export const burnLiquidityMenu = async (ctx: any, id: string) => {
    const CHAIN = CHAINS[CHAIN_ID]
    const token = await Tokens.findById(id)
    if (!token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
    const tokenContract = new Contract(token.address, token.abi, jsonRpcProvider)
    const uniPair = await tokenContract.uniPair()
    const uniPairContract = new Contract(uniPair, ERC20ABI, jsonRpcProvider)
    const [uniBalance, totalSupply] = await Promise.all([uniPairContract.balanceOf(token.deployer.address), uniPairContract.totalSupply()])

    const burnPercentage = ctx.session.burnPercentage
    const text =
        `<b>🔥 Liquidity Burn</b>\n` +
        `Use this menu to burn liquidity from the ${token.symbol} contract. Please check burn percent before confirmation\n\n` +
        `<b><i>*Your lp balance</i></b>:   <code>${formatNumber(formatEther(uniBalance))}UNI-V2 / ${formatNumber(formatEther(totalSupply))}UNI-V2</code>  (${formatNumber((Number(formatEther(uniBalance)) / Number(formatEther(totalSupply))) * 100)}%)`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: `Burn Percentage ${isNaN(Number(burnPercentage)) ? 0 : burnPercentage}%`, callback_data: `scene_contractBurnLpEditScene_${id}` }],
                [
                    { text: '× Cancel', callback_data: `lp_settings_${id}` },
                    { text: '🔥 Burn', callback_data: `confirm_burnLiquidity_${id}` }
                ]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

/**
 * menu for removing lp
 * @param ctx
 * @param id
 * @returns
 */
export const removeLiquidityMenu = async (ctx: any, id: string) => {
    const CHAIN = CHAINS[CHAIN_ID]
    const token = await Tokens.findById(id)
    if (!token) {
        return ctx.reply('⚠ There is no token for this id')
    }
    const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
    const tokenContract = new Contract(token.address, token.abi, jsonRpcProvider)
    const uniPair = await tokenContract.uniPair()
    const uniPairContract = new Contract(uniPair, ERC20ABI, jsonRpcProvider)
    const [uniBalance, totalSupply] = await Promise.all([uniPairContract.balanceOf(token.deployer.address), uniPairContract.totalSupply()])

    const removePercentage = ctx.session.removePercentage
    const text =
        `<b>🧹 Liquidity Remove</b>\n` +
        `Use this menu to remove liquidity from the ${token.symbol} contract. Please check burn percent before confirmation\n\n` +
        `<b><i>*Your lp balance</i></b>:   <code>${formatNumber(formatEther(uniBalance))}UNI-V2 / ${formatNumber(formatEther(totalSupply))}UNI-V2</code>  (${formatNumber((Number(formatEther(uniBalance)) / Number(formatEther(totalSupply))) * 100)}%)`

    const settings = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: `Remove Percentage ${isNaN(Number(removePercentage)) ? 0 : removePercentage}%`, callback_data: `scene_contractRemoveLpEditScene_${id}` }],
                [
                    { text: '× Cancel', callback_data: `lp_settings_${id}` },
                    { text: '🧹 Remove', callback_data: `confirm_removeLiquidity_${id}` }
                ]
            ],
            resize_keyboard: true
        }
    }
    replyWithUpdatedMessage(ctx, text, settings)
}

/**when click confirm add Liquidity
 * @param ctx
 * @param id
 * @returns
 */
export const addLiquidity = async (ctx: any, id: string) => {
    ctx.session.mainMsgId = undefined
    const token = await Tokens.findById(id)
    const chainId = CHAIN_ID
    const CHAIN = CHAINS[chainId]

    try {
        // token amount for LP
        // const tokenAmount = parseEther(localeNumber(token.totalSupply * token.lpSupply * 0.01))
        const tokenAmount = parseEther(String(token.totalSupply))
        const ethAmount = parseEther(String(token.lpEth))

        const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const privteKey = decrypt(token.deployer.key)
        const wallet = new Wallet(privteKey, jsonRpcProvider)

        // eth balance testing
        await ctx.reply(`⏰ <code>ETH</code> balanace checking...`, { parse_mode: 'HTML' })
        const _ethBalance = await jsonRpcProvider.getBalance(token.deployer.address) // balance is in wei
        const ethBalance = formatEther(_ethBalance) // Convert to ETH

        if (Number(token.lpEth) > Number(ethBalance)) {
            ctx.reply(`⚠ Deployer wallet has <code>${formatNumber(ethBalance)}ETH</code>,  but required <code>${formatNumber(token.lpEth)}ETH</code>.\n<code>${token.deployer.address}</code>`, { parse_mode: 'HTML' })
            return
        }

        const tokenContract = new Contract(token.address, token.abi, wallet)
        const routerAddress = CHAINS[CHAIN_ID].UNISWAP_ROUTER_ADDRESS
        // check token balance
        await ctx.reply(`⏰ <code>${token.symbol}</code> balanace checking...`, { parse_mode: 'HTML' })
        const _tokenBalance = await tokenContract.balanceOf(token.deployer.address)
        const tokenBalance = formatEther(_tokenBalance)
        if (Number(token.totalSupply * token.lpSupply * 0.01) > Number(tokenBalance)) {
            ctx.reply(
                `⚠ Deployer wallet has <code>${formatNumber(tokenBalance)} ${token.symbol}</code>,  but required <code>${formatNumber(token.totalSupply * token.lpSupply * 0.01)} ${token.symbol}</code>.\n*<code>${token.deployer.address}</code>`,
                {
                    parse_mode: 'HTML'
                }
            )
            return
        }
        // approve for lp adding
        await ctx.reply(`⏰ Approving <code>${token.symbol}</code> for adding liquidity...`, { parse_mode: 'HTML' })
        const approveTx = await tokenContract.approve(routerAddress, tokenAmount)
        await approveTx.wait()
        console.log('::approved for lp adding:', approveTx.hash)
        // app LP
        await ctx.reply(`⏰ Adding Liquidity for <code>${token.symbol}</code>...`, { parse_mode: 'HTML' })
        const routerContract = new Contract(CHAIN.UNISWAP_ROUTER_ADDRESS, RouterABI, wallet)
        const addLpTxData = await routerContract.addLiquidityETH(
            token.address,
            tokenAmount, // The amount of tokens
            0, // Minimum amount of tokens (set to 0 for no minimum)
            0, // Minimum amount of ETH (set to 0 for no minimum)
            wallet.address, // The wallet address
            Math.floor(Date.now() / 1000) + 60 * 20, // 20mins from now
            { value: ethAmount } // ETH amount being sent with the transaction
        )
        await addLpTxData.wait()
        console.log('::added lp: ', addLpTxData.hash)
        await Tokens.findByIdAndUpdate(id, { lpAdded: true })

        replyWithUpdatedMessage(ctx, `🌺 Successfuly Liquidity has been added for <code>${formatNumber(token.totalSupply * token.lpSupply * 0.01)} ${token.symbol}</code> + <code>${formatNumber(token.lpEth)} ETH</code>`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${addLpTxData.hash}`)], [{ text: '← Back', callback_data: `lp_settings_${id}` }]],
                resize_keyboard: true
            }
        })
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token.address, `lp_settings_${id}`, 'Error while Adding Liquidity')
    }
}
/**when click confirm add Liquidity
 * @param ctx
 * @param id
 * @returns
 */
export const burnLiquidity = async (ctx: any, id: string) => {
    ctx.session.mainMsgId = undefined

    const burnPercentage = Number(ctx.session.burnPercentage)
    if (isNaN(burnPercentage) || burnPercentage <= 0) {
        ctx.reply(`⚠ Invalid number (${burnPercentage}) for burn percentage of liquidity, Please check percentage of lp you wanna burn`, {
            parse_mode: 'HTML'
        })

        return
    }

    const token = await Tokens.findById(id)
    const chainId = CHAIN_ID
    const CHAIN = CHAINS[chainId]

    try {
        // token amount for LP

        const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const privteKey = decrypt(token.deployer.key)
        const wallet = new Wallet(privteKey, jsonRpcProvider)

        // eth balance testing

        const tokenContract = new Contract(token.address, token.abi, wallet)
        const uniPair = await tokenContract.uniPair()
        const uniPairContract = new Contract(uniPair, ERC20ABI, wallet)
        const uniBalance = await uniPairContract.balanceOf(token.deployer.address)
        const _uniBalance = Number(formatEther(uniBalance))

        await ctx.reply(`⏰ Your LP share checking...`, { parse_mode: 'HTML' })
        if (Number(uniBalance) <= 0) {
            ctx.reply(`⚠ There is no your LP share for this token on Uniswap v2, please check your LP share of liquidity.`, {
                parse_mode: 'HTML'
            })
            burnLiquidityMenu(ctx, id)
            return
        }
        await ctx.reply(`⏰ Burning your lp...`, { parse_mode: 'HTML' })
        const amountToBurn = parseEther(String(_uniBalance * 0.01 * burnPercentage))
        const tx = await uniPairContract.transfer('0x000000000000000000000000000000000000dEaD', amountToBurn)
        await tx.wait()

        replyWithUpdatedMessage(ctx, `🌺 Successfuly burned your ${burnPercentage}% of LP for <code>${token.symbol}</code>. Please check following details`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)], [{ text: '← Back', callback_data: `burn_liquidity_${id}` }]],
                resize_keyboard: true
            }
        })
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token.address, `burn_liquidity_${id}`, 'Error while Burning Liquidity')
    }
}
/**when click confirm add Liquidity
 * @param ctx
 * @param id
 * @returns
 */
export const removeLiquidity = async (ctx: any, id: string) => {
    const removePercentage = Number(ctx.session.removePercentage)
    if (isNaN(removePercentage) || removePercentage <= 0) {
        ctx.reply(`⚠ Invalid number (${removePercentage}) for burn percentage of liquidity, Please check percentage of lp you wanna burn`, {
            parse_mode: 'HTML'
        })

        return
    }

    ctx.session.mainMsgId = undefined
    const token = await Tokens.findById(id)
    const chainId = CHAIN_ID
    const CHAIN = CHAINS[chainId]

    try {
        // token amount for LP
        const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
        const privteKey = decrypt(token.deployer.key)
        const wallet = new Wallet(privteKey, jsonRpcProvider)
        // eth balance testing
        const tokenContract = new Contract(token.address, token.abi, wallet)
        const uniPair = await tokenContract.uniPair()
        const uniPairContract = new Contract(uniPair, ERC20ABI, wallet)
        const uniBalance = await uniPairContract.balanceOf(token.deployer.address)
        const _uniBalance = Number(formatEther(uniBalance))
        // lp balance checking
        await ctx.reply(`⏰ Your LP share checking...`, { parse_mode: 'HTML' })
        if (Number(uniBalance) <= 0) {
            ctx.reply(`⚠ There is no your LP share for this token on Uniswap v2, please check your LP share of liquidity.`, {
                parse_mode: 'HTML'
            })
            removeLiquidityMenu(ctx, id)
            return
        }
        const amountToRemove = parseEther(String(_uniBalance * 0.01 * removePercentage))
        // approve
        await ctx.reply(`⏰ Approving your LP tokens...`, { parse_mode: 'HTML' })
        const approveTx = await uniPairContract.approve(CHAIN.UNISWAP_ROUTER_ADDRESS, amountToRemove)
        await approveTx.wait()
        // remve lp
        await ctx.reply(`⏰ Removing ${removePercentage}% of your LP...`, { parse_mode: 'HTML' })
        const routerContract = new Contract(CHAIN.UNISWAP_ROUTER_ADDRESS, RouterABI, wallet)
        const tx = await routerContract.removeLiquidityETHSupportingFeeOnTransferTokens(
            token.address,
            amountToRemove,
            0,
            0,
            token.deployer.address,
            Math.floor(Date.now() / 1000) + 60 * 20 // 20mins from now
        )
        await tx.wait()

        replyWithUpdatedMessage(ctx, `🌺 Successfuly removed your ${removePercentage}% of LP for <code>${token.symbol}</code>. Please check following details`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)], [{ text: '← Back', callback_data: `remove_liquidity_${id}` }]],
                resize_keyboard: true
            }
        })
    } catch (err) {
        catchContractErrorException(ctx, err, CHAIN, token.address, `remove_liquidity_${id}`, 'Error while Removing Liquidity')
    }
}
