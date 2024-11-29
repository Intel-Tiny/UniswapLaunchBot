import { Schema, Model, model } from 'mongoose'

export interface ILanuch extends Document {
    instantLaunch: boolean
    autoLP: boolean

    name: string
    symbol: string
    totalSupply: number
    maxSwap: number
    maxWallet: number
    blacklistCapability: boolean

    lpSupply: number
    lpEth: number
    contractFunds: number

    feeWallet?: string
    buyFee: number
    sellFee: number
    liquidityFee: number
    swapThreshold: number

    website: string
    twitter: string
    telegram: string
    custom: string
    deployer?: {
        address: string
        key: string
    }
    bundledWallets: [
        {
            address: string
            key: string
        }
    ]
    minBuy: number
    maxBuy: number

    isFilterFeePaid: boolean
}
interface ILanuchModel extends Model<ILanuch> {}

const LaunchSchema: Schema = new Schema({
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
    /////// token variables
    name: {
        type: String,
        require: true,
        default: 'New Token'
    },
    symbol: {
        type: String,
        require: true,
        default: 'NT'
    },
    totalSupply: {
        type: Number,
        default: 1000000000
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
        default: 30 //percent
    },
    lpEth: {
        type: Number,
        default: 1
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
    // if created, set true
    enabled: {
        type: Boolean,
        default: false
    },
    //fee paid
    isFilterFeePaid: {
        type: Boolean,
        default: false
    }
})

const Launches: ILanuchModel = model<ILanuch, ILanuchModel>('launches', LaunchSchema)
export default Launches
