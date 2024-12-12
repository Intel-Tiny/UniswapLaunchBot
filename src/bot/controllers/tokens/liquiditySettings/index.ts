import { CHAINS, CHAIN_ID } from '@/config/constant'
import Tokens from '@/models/Tokens'
import { catchContractErrorException, decrypt, formatNumber, localeNumber, replyWithUpdatedMessage } from '@/share/utils'
import { Contract, JsonRpcProvider, Wallet, formatEther, parseEther } from 'ethers'
import RouterABI from '@/constants/ABI/routerABI.json'
import PositionManagerABI from '@/constants/ABI/positionManagerABI.json'
import WethABI from '@/constants/ABI/wethABI.json'
import { Markup } from 'telegraf'
import ERC20ABI from '@/constants/ABI/ERC20.json'
import { sqrtPriceX96, getPriceToTick } from '@/share/utils'

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
    if (token.uniswapV3) {
        const positionContract = new Contract(CHAIN.POSITION_MANAGER_ADDRESS, PositionManagerABI, jsonRpcProvider)
        const count = await positionContract.balanceOf(token.deployer.address)
        const lastTokenId = await positionContract.tokenOfOwnerByIndex(token.deployer.address, BigInt(Number(count) - 1))
        const text = `<b>🔥 Liquidity Burn</b>\n` + `Use this menu to burn liquidity from the ${token.symbol} contract.\n\n`
        const settings = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '× Cancel', callback_data: `lp_settings_${id}` },
                        { text: '🔥 Burn', callback_data: `confirm_burnLiquidity_${id}` }
                    ]
                ],
                resize_keyboard: true
            }
        }
        replyWithUpdatedMessage(ctx, text, settings)
    } else {
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
    let text
    if (token.uniswapV3) {
        const positionContract = new Contract(CHAIN.POSITION_MANAGER_ADDRESS, PositionManagerABI, jsonRpcProvider)
        const count = await positionContract.balanceOf(token.deployer.address)
        const lastTokenId = await positionContract.tokenOfOwnerByIndex(token.deployer.address, BigInt(Number(count) - 1))
        const positionData = await positionContract.positions(lastTokenId)
        const liquidityAmount = positionData.liquidity
        console.log('positionData: ', positionData)
        text =
            `<b>🧹 Liquidity Remove</b>\n` +
            `Use this menu to remove liquidity from the ${token.symbol} contract. Please check burn percent before confirmation\n\n` +
            `<b><i>*Your lp balance</i></b>:   <code>${formatNumber(formatEther(liquidityAmount))}</code>`
    } else {
        const tokenContract = new Contract(token.address, token.abi, jsonRpcProvider)
        const uniPair = await tokenContract.uniPair()
        const uniPairContract = new Contract(uniPair, ERC20ABI, jsonRpcProvider)
        const [uniBalance, totalSupply] = await Promise.all([uniPairContract.balanceOf(token.deployer.address), uniPairContract.totalSupply()])
        text =
            `<b>🧹 Liquidity Remove</b>\n` +
            `Use this menu to remove liquidity from the ${token.symbol} contract. Please check burn percent before confirmation\n\n` +
            `<b><i>*Your lp balance</i></b>:   <code>${formatNumber(formatEther(uniBalance))}UNI-V2 / ${formatNumber(formatEther(totalSupply))}UNI-V2</code>  (${formatNumber((Number(formatEther(uniBalance)) / Number(formatEther(totalSupply))) * 100)}%)`
    }
    const removePercentage = ctx.session.removePercentage
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
    if (token.uniswapV2) {
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
    } else if (token.uniswapV3) {
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
            const routerAddress = CHAINS[CHAIN_ID].POSITION_MANAGER_ADDRESS
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
            const wethAddress = process.env.WETH_ADDRESS
            const wethContract = new Contract(wethAddress, WethABI, wallet)
            const wethBalance = await wethContract.balanceOf(wallet.address)
            if (Number(formatEther(wethBalance)) < Number(token.lpEth)) {
                const depositEthTx = await wethContract.deposit({ value: parseEther(String(token.lpEth)) })
                await depositEthTx.wait()
            }
            // approve for lp adding
            await ctx.reply(`⏰ Approving <code>${token.symbol}</code> for adding liquidity...`, { parse_mode: 'HTML' })
            console.log('tokenAmount: ' + tokenAmount)
            const approveTx = await tokenContract.approve(routerAddress, tokenAmount)
            await approveTx.wait()
            console.log('approved token amount')
            const wethApproveTx = await wethContract.approve(routerAddress, _ethBalance)
            await wethApproveTx.wait()
            console.log('::approved weth:')
            // initialize pool
            await ctx.reply(`⏰ Initializing pool ...`, { parse_mode: 'HTML' })
            const routerContract = new Contract(CHAIN.POSITION_MANAGER_ADDRESS, PositionManagerABI, wallet)
            const currentPrice = Number(token.totalSupply * token.lpSupply * 0.01) / Number(token.lpEth)
            console.log('current price: ', currentPrice)
            const sqrtPrice = sqrtPriceX96(currentPrice)
            console.log('token address -> ', token.address, ' weth address -> ', wethAddress, ' feeTier -> ', BigInt(token.feeTier), ' sqrtPrice -> ', sqrtPrice)
            let token0: any, token1: any
            if (wethAddress.toLowerCase() < token.address.toLowerCase()) {
                token0 = wethAddress
                token1 = token.address
            } else {
                token0 = token.address
                token1 = wethAddress
            }
            const initializePoolTxData = await routerContract.createAndInitializePoolIfNecessary(token0, token1, BigInt(token.feeTier), sqrtPrice)
            await initializePoolTxData.wait()
            console.log('::initialized pool:', initializePoolTxData.hash)
            // app LP
            await ctx.reply(`⏰ Adding Liquidity for <code>${token.symbol}</code>...`, { parse_mode: 'HTML' })
            const tickLower = getPriceToTick((currentPrice * token.lowerPrice) / 100)
            const tickUpper = getPriceToTick((currentPrice * token.higherPrice) / 100)
            console.log('tickLower: ', tickLower, ' tickUpper: ', tickUpper)
            let tempTickLower = Math.floor(tickLower / 200) * 200
            let tempTickUpper = Math.floor(tickUpper / 200) * 200
            console.log('tempTickLower:', tempTickLower, ' tempTickUpper: ', tempTickUpper)
            console.log('BigInt(Math.floor(Date.now() / 1000) + 1200) = ', BigInt(Math.floor(Date.now() / 1000) + 1800))

            // console.log('parseEther(String(token.lpEth)): ', parseEther(String(token.lpEth)))
            // console.log('BigInt(parseEther(String(Number(token.totalSupply * token.lpSupply * 0.01)))): ', BigInt(parseEther(String(Number(token.totalSupply * token.lpSupply * 0.01)))))
            const addLpTxData = await routerContract.mint({
                token0: wethAddress,
                token1: token.address,
                fee: BigInt(token.feeTier),
                tickLower: BigInt(tempTickLower),
                tickUpper: BigInt(tempTickUpper),
                amount0Desired: BigInt(parseEther(String(token.lpEth))),
                amount1Desired: BigInt(parseEther(String(Number(token.totalSupply * token.lpSupply * 0.01)))),
                amount0Min: 0,
                amount1Min: 0,
                recipient: wallet.address,
                deadline: BigInt(Math.floor(Date.now() / 1000) + 1800)
            })
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
            console.log(err)
            catchContractErrorException(ctx, err, CHAIN, token.address, `lp_settings_${id}`, 'Error while Adding Liquidity')
        }
    }
}
/**when click confirm add Liquidity
 * @param ctx
 * @param id
 * @returns
 */
export const burnLiquidity = async (ctx: any, id: string) => {
    ctx.session.mainMsgId = undefined
    const token = await Tokens.findById(id)
    const chainId = CHAIN_ID
    const CHAIN = CHAINS[chainId]
    const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
    const privteKey = decrypt(token.deployer.key)
    const wallet = new Wallet(privteKey, jsonRpcProvider)
    if (token.uniswapV2) {
        const burnPercentage = Number(ctx.session.burnPercentage)
        if (isNaN(burnPercentage) || burnPercentage <= 0) {
            ctx.reply(`⚠ Invalid number (${burnPercentage}) for burn percentage of liquidity, Please check percentage of lp you wanna burn`, {
                parse_mode: 'HTML'
            })

            return
        }

        try {
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
    } else{
        const positionContract = new Contract(CHAIN.POSITION_MANAGER_ADDRESS, PositionManagerABI, wallet)
        const count = await positionContract.balanceOf(token.deployer.address)
        await ctx.reply(`⏰ Your LP share checking...`, { parse_mode: 'HTML' })
        if (Number(count) <= 0) {
            ctx.reply(`⚠ There is no your LP share for this token on Uniswap v2, please check your LP share of liquidity.`, {
                parse_mode: 'HTML'
            })
            burnLiquidityMenu(ctx, id)
            return
        }
        const lastTokenId = await positionContract.tokenOfOwnerByIndex(token.deployer.address, BigInt(Number(count) - 1))
        console.log("lastTokenId: ", lastTokenId)
        await ctx.reply(`⏰ Burning your lp...`, { parse_mode: 'HTML' })
        const approveTx = await positionContract.approve(CHAIN.POSITION_MANAGER_ADDRESS, lastTokenId)
        console.log("approving...")
        await approveTx.wait()
        console.log("approved ....")
        const tx = await positionContract.transferFrom(token.deployer.address, '0x000000000000000000000000000000000000dEaD', lastTokenId)
        await tx.wait()
        replyWithUpdatedMessage(ctx, `🌺 Successfuly burned your LP for <code>${token.symbol}</code>. Please check following details`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${tx.hash}`)], [{ text: '← Back', callback_data: `burn_liquidity_${id}` }]],
                resize_keyboard: true
            }
        })
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
    if (token.uniswapV2) {
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
    } else {
        try {
            // token amount for LP
            const jsonRpcProvider = new JsonRpcProvider(CHAIN.RPC)
            const privteKey = decrypt(token.deployer.key)
            const wallet = new Wallet(privteKey, jsonRpcProvider)
            const positionContract = new Contract(CHAIN.POSITION_MANAGER_ADDRESS, PositionManagerABI, wallet)
            const count = await positionContract.balanceOf(token.deployer.address)
            const lastTokenId = await positionContract.tokenOfOwnerByIndex(token.deployer.address, BigInt(Number(count) - 1))
            const positionData = await positionContract.positions(lastTokenId)
            const liquidityAmount = positionData.liquidity
            // eth balance testing
            // lp balance checking
            await ctx.reply(`⏰ Your LP share checking...`, { parse_mode: 'HTML' })
            if (Number(liquidityAmount) <= 0) {
                ctx.reply(`⚠ There is no your LP share for this token on Uniswap v3, please check your LP share of liquidity.`, {
                    parse_mode: 'HTML'
                })
                removeLiquidityMenu(ctx, id)
                return
            }
            const amountToRemove = BigInt(Number(liquidityAmount) * 0.01 * removePercentage)
            // remve lp
            await ctx.reply(`⏰ Removing ${removePercentage}% of your LP...`, { parse_mode: 'HTML' })
            const decreaseLiquidityTx = await positionContract.decreaseLiquidity({
                tokenId: lastTokenId,
                liquidity: amountToRemove,
                amount0Min: 0,
                amount1Min: 0,
                deadline: Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now
            })
            await decreaseLiquidityTx.wait()
            replyWithUpdatedMessage(ctx, `🌺 Successfuly removed your ${removePercentage}% of LP for <code>${token.symbol}</code>. Please check following details`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, `${CHAIN.explorer}/tx/${decreaseLiquidityTx.hash}`)], [{ text: '← Back', callback_data: `remove_liquidity_${id}` }]],
                    resize_keyboard: true
                }
            })
        } catch (err) {
            catchContractErrorException(ctx, err, CHAIN, token.address, `remove_liquidity_${id}`, 'Error while Removing Liquidity')
        }
    }
}
