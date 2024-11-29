import crypto from 'crypto-js'
import fs from 'fs'
import path from 'path'
import solc from 'solc'
import axios from 'axios'
import { CHAIN_ID, CHAINS } from '@/config/constant'
import { start as startMenu } from '@/bot/controllers/main'
import { menu as deployersMenu } from '@/bot/controllers/deployers'
import { menu as launcherMenu } from '@/bot/controllers/launcher'
import { menu as walletsMenu } from '@/bot/controllers/snipers'
import { menu as tokensMenu } from '@/bot/controllers/tokens'
import { CHAIN } from '@/types'
import { Markup } from 'telegraf'
import { JsonRpcProvider, Wallet } from 'ethers'

/**
 * delay specific time Promise
 * @param {*} duration seconds
 * @returns
 */
export const sleep = (duration: number) =>
    new Promise((resolve: any, reject: any) => {
        try {
            setTimeout(() => {
                resolve()
            }, duration * 1000)
        } catch (err) {
            reject()
        }
    })

/**
 * decrypt plain text using AES
 * @param text
 * @param key
 * @returns
 */
export const encrypt = (text: string, key?: string) => {
    const _key = key ?? process.env.SECRET_KEY
    return crypto.AES.encrypt(text, _key).toString()
}
/**
 * decrypt cyper text using AES
 * @param cipherText
 * @param key
 * @returns
 */
export const decrypt = (cipherText: string, key?: string) => {
    try {
        const _key = key ?? process.env.SECRET_KEY
        const bytes = crypto.AES.decrypt(cipherText, _key)
        const text = bytes.toString(crypto.enc.Utf8)
        if (text) {
            return text
        } else {
            throw 'empty string'
        }
    } catch (err) {
        throw 'invalid private key'
    }
}

/**
 * verify contract
 * @param contractaddress
 * @param sourceCode
 * @param contractname
 * @returns
 */
export const verifyContract = async (contractaddress: string, sourceCode: string, contractname: string, chainId: number) => {
    try {
        const CHAIN = CHAINS[chainId]
        console.log('::sending contract code to etherscan to verify...', `${CHAIN.ETHERSCAN_API_URL}/api?module=contract&action=verifysourcecode&apikey=${CHAIN.ETHERSCAN_API_KEY}`)
        const { data } = await axios.post(
            `${CHAIN.ETHERSCAN_API_URL}/api?module=contract&action=verifysourcecode&apikey=${CHAIN.ETHERSCAN_API_KEY}`,
            {
                codeformat: 'solidity-single-file',
                sourceCode,
                contractaddress,
                contractname,
                compilerversion: 'v0.8.19+commit.7dd6d404',
                optimizationUsed: 0,
                runs: 200
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        )
        if (data.status === '0') {
            return {
                status: 'error',
                message: data.result
            }
        } else {
            return {
                status: 'success',
                message: data.result
            }
        }
    } catch (err) {
        console.log(err)
        return {
            status: 'error',
            message: 'Unexpected issue occured'
        }
    }
}

/**
 * format provided number
 * @param value
 * @returns
 */
export const formatNumber = (value: number | string) =>
    new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 5
    }).format(Number(value))

/**
 * format provided number
 * @param value
 * @returns
 */
export const formatSmallNumber = (value: number | string) =>
    new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8
    }).format(Number(value))

/**
 * compile solidity code using solc, and generate bytecode and abi
 * @param param0
 * @returns
 */
export const compileContract = ({ chainId, name, symbol, totalSupply, maxSwap, maxWallet, sellFee, buyFee, liquidityFee, swapThreshold, instantLaunch, feeWallet, website, twitter, telegram, custom }) =>
    new Promise(async (resolve, reject) => {
        const CHAIN = CHAINS[chainId]
        const contractPath = path.resolve(__dirname, '../constants/contracts/token.sol') // Path to your Solidity file
        const source = fs.readFileSync(contractPath, 'utf8') // Read the contract file
        // todo make source code
        const sourceCode = source
        const _symbol = symbol.replace(/\s/g, '') //remove all space from symbol string

        let _sourceCode = sourceCode
        _sourceCode = _sourceCode.replace(/CONTRACT_SYMBOL/g, _symbol)
        _sourceCode = _sourceCode.replace(/CONTRACT_NAME/g, name)
        _sourceCode = _sourceCode.replace(/CONTRACT_TOTAL_SUPPLY/g, totalSupply)
        _sourceCode = _sourceCode.replace(/CONTRACT_BUY_FEE/g, buyFee.toFixed())
        _sourceCode = _sourceCode.replace(/CONTRACT_SELL_FEE/g, sellFee.toFixed())
        _sourceCode = _sourceCode.replace(/CONTRACT_LP_FEE/g, liquidityFee.toFixed())
        _sourceCode = _sourceCode.replace(/CONTRACT_MAX_SWAP/g, maxSwap.toFixed())
        _sourceCode = _sourceCode.replace(/CONTRACT_MAX_WALLET/g, maxWallet.toFixed())
        _sourceCode = _sourceCode.replace(/CCONTRACT_FEE_THRESHOLD/g, (swapThreshold * 1000).toFixed())
        _sourceCode = _sourceCode.replace(/CONTRACT_UNISWAP_ROUTER/g, CHAIN.UNISWAP_ROUTER_ADDRESS)
        _sourceCode = _sourceCode.replace(/CONTRACT_DAO_ADDRESS/g, process.env.DAO_ADDRESS)
        // set info
        _sourceCode = _sourceCode.replace('<WEBSITE>', website ? `Website: ${website}` : '')
        _sourceCode = _sourceCode.replace('<TWITTER>', twitter ? `\n    Twitter: ${twitter}` : '')
        _sourceCode = _sourceCode.replace('<TELEGRAM>', telegram ? `\n    Telegram: ${telegram}` : '')
        _sourceCode = _sourceCode.replace('<CUSTOM>', custom ? `\n    ${custom}` : '')

        _sourceCode = _sourceCode.replace('CONTRACT_INSTANT_LAUNCH_ENABLED', instantLaunch ? 'swapEnabled = true;' : '')
        // _sourceCode = _sourceCode.replace('CONTRACT_INSTANT_LAUNCH_ENABLED', instantLaunch ? 'uniPair = IUniswapV2Factory(_router.factory()).createPair(address(this), _router.WETH());' : '')
        _sourceCode = _sourceCode.replace('CONTRACT_FEE_WALLET', feeWallet)

        // Solc input and settings
        const input = {
            language: 'Solidity',
            sources: {
                [`${_symbol}.sol`]: {
                    content: _sourceCode
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode']
                    }
                }
            }
        }

        solc.loadRemoteVersion('v0.8.19+commit.7dd6d404', function (err: any, solcSnapshot: any) {
            if (err) {
                return reject('error to get solc version compiler')
            } else {
                console.log('::solc version:', solcSnapshot.version())
                const compiledContract = JSON.parse(solcSnapshot.compile(JSON.stringify(input)))
                const contractFile = compiledContract.contracts[`${_symbol}.sol`][_symbol]
                const abi = contractFile.abi
                const bytecode = contractFile.evm.bytecode.object
                return resolve({
                    abi,
                    bytecode,
                    sourceCode: _sourceCode
                })
            }
        })
    })

/**
 * compile solidity code using solc, and generate bytecode and abi
 * @param param0
 * @returns
 */
export const compileContractForEstimation = ({ chainId, name, symbol, totalSupply, maxSwap, maxWallet, sellFee, buyFee, liquidityFee, swapThreshold, instantLaunch, feeWallet, website, twitter, telegram, custom }) =>
    new Promise(async (resolve, reject) => {
        const CHAIN = CHAINS[chainId]
        const contractPath = path.resolve(__dirname, '../constants/contracts/token.sol') // Path to your Solidity file
        const source = fs.readFileSync(contractPath, 'utf8') // Read the contract file
        // todo make source code
        const sourceCode = source
        const _symbol = symbol.replace(/\s/g, '') //remove all space from symbol string

        let _sourceCode = sourceCode
        _sourceCode = _sourceCode.replace(/CONTRACT_SYMBOL/g, _symbol)
        _sourceCode = _sourceCode.replace(/CONTRACT_NAME/g, name)
        _sourceCode = _sourceCode.replace(/CONTRACT_TOTAL_SUPPLY/g, totalSupply)
        _sourceCode = _sourceCode.replace(/CONTRACT_BUY_FEE/g, buyFee.toFixed())
        _sourceCode = _sourceCode.replace(/CONTRACT_SELL_FEE/g, sellFee.toFixed())
        _sourceCode = _sourceCode.replace(/CONTRACT_LP_FEE/g, liquidityFee.toFixed())
        _sourceCode = _sourceCode.replace(/CONTRACT_MAX_SWAP/g, maxSwap.toFixed())
        _sourceCode = _sourceCode.replace(/CONTRACT_MAX_WALLET/g, maxWallet.toFixed())
        _sourceCode = _sourceCode.replace(/CCONTRACT_FEE_THRESHOLD/g, (swapThreshold * 1000).toFixed())
        _sourceCode = _sourceCode.replace(/CONTRACT_UNISWAP_ROUTER/g, CHAIN.UNISWAP_ROUTER_ADDRESS)
        _sourceCode = _sourceCode.replace(/CONTRACT_DAO_ADDRESS/g, process.env.DAO_ADDRESS)
        // set info
        _sourceCode = _sourceCode.replace('<WEBSITE>', website ? `Website: ${website}` : '')
        _sourceCode = _sourceCode.replace('<TWITTER>', twitter ? `\n    Twitter: ${twitter}` : '')
        _sourceCode = _sourceCode.replace('<TELEGRAM>', telegram ? `\n    Telegram: ${telegram}` : '')
        _sourceCode = _sourceCode.replace('<CUSTOM>', custom ? `\n    ${custom}` : '')

        _sourceCode = _sourceCode.replace('CONTRACT_INSTANT_LAUNCH_ENABLED', instantLaunch ? 'swapEnabled = true;' : '')
        _sourceCode = _sourceCode.replace('CONTRACT_FEE_WALLET', feeWallet)
        _sourceCode = _sourceCode.replace(/tx.origin/g, '0x35F3FA4B30688815667Eb81Af661b494129F883E')

        // Solc input and settings
        const input = {
            language: 'Solidity',
            sources: {
                [`${_symbol}.sol`]: {
                    content: _sourceCode
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode']
                    }
                }
            }
        }

        solc.loadRemoteVersion('v0.8.19+commit.7dd6d404', function (err: any, solcSnapshot: any) {
            if (err) {
                return reject('error to get solc version compiler')
            } else {
                console.log('::solc version:', solcSnapshot.version())
                const compiledContract = JSON.parse(solcSnapshot.compile(JSON.stringify(input)))
                const contractFile = compiledContract.contracts[`${_symbol}.sol`][_symbol]
                const abi = contractFile.abi
                const bytecode = contractFile.evm.bytecode.object
                return resolve({
                    abi,
                    bytecode,
                    sourceCode: _sourceCode
                })
            }
        })
    })

export const localeNumber = (number: number | string) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 18,
        useGrouping: false // Disable commas
    }).format(Number(number))
}
/**
 *
 * @param ctx
 * @param msgId
 */
export const deleteMessage = async (ctx: any, msgId: any) => {
    if (msgId) {
        await ctx.telegram.deleteMessage(ctx.chat.id, msgId).catch((err: any) => {
            // blablabla
        })
    }
}

/**
 * delete old msgs except for main msg
 * @param ctx
 * @param msgId
 */
export const deleteOldMessages = async (ctx: any) => {
    try {
        const oldMsgId = Number(ctx.session.mainMsgId)
        const msgIds = Array.isArray(ctx.session.msgIds) ? ctx.session.msgIds : []
        msgIds.filter((id: number) => id !== oldMsgId).map((id: number) => deleteMessage(ctx, id))
        ctx.session.msgIds = []
    } catch (err) {
        //blablabla
    }
}
/**
 * send updated msg to users
 * @param ctx
 * @param text
 * @param settings
 */
export const replyWithUpdatedMessage = async (ctx: any, text: string, settings: any) => {
    const oldMsgId = Number(ctx.session.mainMsgId)
    if (!isNaN(oldMsgId)) {
        deleteOldMessages(ctx)
        await ctx.telegram
            .editMessageText(ctx.chat.id, oldMsgId, 0, text, settings)
            .then(({ message_id }: any) => {
                ctx.session.mainMsgId = message_id
            })
            .catch(async (err: any) => {
                if (!String(err).includes('Bad Request: message is not modified:')) {
                    await ctx
                        .reply(text, settings)
                        .then(({ message_id }: any) => {
                            ctx.session.mainMsgId = message_id
                        })
                        .catch((err: any) => {
                            console.log('::start::', err, '::end::')
                            ctx.reply('⚡ Sorry, we detected sth wrong. Can you start bot again please?')
                        })
                }
            })
    } else {
        await ctx
            .reply(text, settings)
            .then(({ message_id }: any) => {
                ctx.session.mainMsgId = message_id
            })
            .catch((err: any) => {
                console.log('::start::', err, '::end::')
                ctx.reply('⚡ Sorry, we detected sth wrong. Can you start bot again please?')
            })
    }
}

export const saveOldMsgIds = async (ctx: any, msgId: any) => {
    if (!isNaN(Number(msgId))) {
        ctx.session.msgIds = Array.isArray(ctx.session.msgIds) ? ctx.session.msgIds : []
        ctx.session.msgIds.push(msgId)
    }
}

export const showMessage = async (ctx: any, msg: string) => {
    const { message_id } = await ctx.reply(msg)
    saveOldMsgIds(ctx, message_id)
}

/**
 *
 * @param ctx
 */
export const checkExit = async (ctx: any) => {
    const menus = {
        '/start': startMenu,
        '/deployers': deployersMenu,
        '/tokens': tokensMenu,
        '/launcher': launcherMenu,
        '/wallets': walletsMenu
    }

    const value = ctx.message.text
    if (value === '/start' || value === '/deployers' || value === '/launcher' || value === '/wallets' || value === '/tokens') {
        deleteMessage(ctx, ctx.session.message_id)
        deleteMessage(ctx, ctx.message.message_id)
        await ctx.scene.leave()
        menus[value](ctx)
        return true
    } else {
        return false
    }
}
/**
 *
 * @param ctx
 * @param text
 * @param settings
 */
export const replyWarningMessage = async (ctx: any, text: string, settings: any = {}) => {
    ctx.session.mainMsgId = undefined
    await replyWithUpdatedMessage(ctx, text, settings)
}
/**
 *
 * @param ctx
 * @param text
 */
export const showNotification = async (ctx: any, text: string) => {
    try {
        await ctx.answerCbQuery(text, { show_alert: true })
    } catch (err) {
        //
    }
}
/**
 * generate random number between two numbers
 * @param min
 * @param max
 * @returns
 */
export const getBetweenNumber = (min: number, max: number) => {
    let number = 0
    do {
        number = Math.random()
    } while (number === 0)
    return number * (max - min) + min
}
/**
 * make the first letter Upper
 * @param text
 * @returns
 */
export const capitalizeFirstLetter = (text: string) => {
    if (text.length > 0) {
        return text.charAt(0).toUpperCase() + text.slice(1)
    } else {
        return ''
    }
}

/**
 * handle contract error exception
 * @param ctx
 * @param id
 * @param err
 * @param chain
 * @param address
 * @param back
 */
export const catchContractErrorException = async (ctx: any, err: any, chain: CHAIN, address: string, back: string, msg: string) => {
    if (err && typeof err === 'object' && 'code' in err) {
        let hash = `${chain.explorer}/address/${address}`
        if ('receipt' in err && err?.receipt?.hash) {
            hash = `${chain.explorer}/tx/${err?.receipt?.hash}`
        }
        replyWithUpdatedMessage(
            ctx,
            `<b>⚠ ${capitalizeFirstLetter(String(err?.code).toLowerCase())}</b>\n<code>${capitalizeFirstLetter(String(err?.info?.error?.message ?? err?.shortMessage ?? 'Detected an unexpected issue. You can contact to support team'))}.  Please check following details.</code>`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[Markup.button.url(`👁 View On Etherscan`, hash)], [{ text: '← Back', callback_data: back }]],
                    resize_keyboard: true
                }
            }
        )
    } else {
        console.log(`::err in ${msg}`, err, ':end::')
        replyWithUpdatedMessage(ctx, `⚠ ${msg}, Please ask for support team`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: '← Back', callback_data: back }]],
                resize_keyboard: true
            }
        })
    }
}

export const emptyWallet = async (key: string, to: string) => {
    try {
        const CHAIN = CHAINS[CHAIN_ID]
        const provider = new JsonRpcProvider(CHAIN.RPC)
        const privKey = decrypt(key)
        const wallet = new Wallet(privKey, provider)
        console.log('address: ', wallet.address, ' to: ', to)
        const feeData = await provider.getFeeData()
        const balance = await provider.getBalance(wallet.address)
        console.log('gasPrice: ', feeData.gasPrice, ' maxFeePerGas: ', feeData.maxFeePerGas)
        const transferFee = BigInt(21000) * feeData.maxFeePerGas
        console.log('balance: ', balance, ' transferFee: ', transferFee)
        if (balance > transferFee) {
            //todo: send
            // const tx = {
            //     to: to,
            //     value: BigInt(BigInt(balance) - BigInt(transferFee))
            // }
            // const txResponse = await wallet.sendTransaction(tx);
            // await txResponse.wait();
            const value = BigInt(BigInt(balance) - BigInt(transferFee) - BigInt(transferFee) / BigInt(2))
            console.log('value: ', value)
            const tx = await wallet.sendTransaction({
                to: to,
                value: value
            })
            await tx.wait()
            console.log('success: ', tx.hash)
        }
    } catch (err) {
        console.log('error: ', err)
    }
}
