import { Schema, Model, model } from 'mongoose'

export interface IToken extends Document {
    instantLaunch: boolean
    autoLP: boolean
    uniswapV2: boolean
    uniswapV3: boolean
    // process
    lpAdded: boolean
    swapEnabled: boolean
    initMC: number
    upperMC: number

    name: string
    symbol: string
    totalSupply: number
    maxSwap: number
    maxWallet: number
    blacklistCapability: boolean

    lpSupply: number
    lpEth: number
    contractFunds: number

    feeWallet: string
    buyFee: number
    sellFee: number
    liquidityFee: number
    swapThreshold: number
    feeTier: number

    website: string
    twitter: string
    telegram: string
    custom: string
    deployer: {
        address: string
        key: string
    }

    address: string
    verified: boolean
    abi: string
    byteCode: string
    sourceCode: string

    bundledWallets: [
        {
            address: string
            key: string
        }
    ]
    minBuy: number
    maxBuy: number
    nftId: number
}
interface ITokenModel extends Model<IToken> {}

const TokenSchema: Schema = new Schema({
    /////// bot username
    userId: {
        type: String,
        require: true
    },
    /////// launch settings
    instantLaunch: {
        type: Boolean,
        default: false
    },
    autoLP: {
        type: Boolean,
        default: false
    },
    uniswapV2: {
        type: Boolean,
        default: true
    },
    uniswapV3: {
        type: Boolean,
        default: false
    },
    /////// process
    lpAdded: {
        type: Boolean,
        default: false
    },
    swapEnabled: {
        type: Boolean,
        default: false
    },
    /////// token variables
    name: {
        type: String,
        require: true
    },
    symbol: {
        type: String,
        require: true
    },
    totalSupply: {
        type: Number,
        require: true
    },
    maxSwap: {
        type: Number,
        default: 0
    },
    maxWallet: {
        type: Number,
        default: 0
    },
    blacklistCapability: {
        type: Boolean,
        default: false
    },
    /////// token distribution
    lpSupply: {
        type: Number,
        default: 100 //percent
    },
    lpEth: {
        type: Number,
        default: 0
    },
    contractFunds: {
        type: Number,
        default: 0 //percent
    },
    /////// fee settings
    feeWallet: {
        type: String,
        default: 'Deployer Wallet'
    },
    buyFee: {
        type: Number,
        default: 0 //percent
    },
    sellFee: {
        type: Number,
        default: 0 //percent
    },
    liquidityFee: {
        type: Number,
        default: 0 //percent
    },
    swapThreshold: {
        type: Number,
        default: 0.5 //percent
    },
    /////// V3 add LP settings
    feeTier: {
        type: Number,
        default: 10000 //V3 Fee Tier
    },
    initMC: {
        type: Number,
        default: 1 //percent of Current Price
    },
    upperMC: {
        type: Number,
        default: 100000 //percent of Current Price
    },
    /////// social settings
    website: {
        type: String,
        default: ''
    },
    twitter: {
        type: String,
        default: ''
    },
    telegram: {
        type: String,
        default: ''
    },
    custom: {
        type: String,
        default: ''
    },
    deployer: {
        address: String,
        key: String
    },
    // contract info
    address: {
        type: String,
        require: true
    },
    verified: {
        type: Boolean,
        require: true
    },
    abi: {
        type: String,
        require: true
    },
    byteCode: {
        type: String,
        require: true
    },
    sourceCode: {
        type: String,
        require: true
    },
    bundledWallets: [
        {
            address: String,
            key: String
        }
    ],
    minBuy: {
        type: Number,
        default: 0 //percent
    },
    maxBuy: {
        type: Number,
        default: 0 //percent
    },
    nftId: {
        type: Number,
        default: 0 //percent
    }
})

const Tokens: ITokenModel = model<IToken, ITokenModel>('tokens', TokenSchema)
export default Tokens
