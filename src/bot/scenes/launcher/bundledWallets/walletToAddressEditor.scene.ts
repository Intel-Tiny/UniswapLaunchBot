import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/manageWallets/sendEthReceiverAddressEdit.controller'

export const walletToAddressEditScene = new Scenes.BaseScene<Context>('walletToAddressEditScene')

walletToAddressEditScene.enter(enterScene)
walletToAddressEditScene.on('text', textHandler)
