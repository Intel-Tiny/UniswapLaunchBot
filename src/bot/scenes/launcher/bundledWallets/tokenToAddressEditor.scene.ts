import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/manageWallets/tokenToAddressEdit.controller'

export const tokenToAddressEditScene = new Scenes.BaseScene<Context>('tokenToAddressEditScene')

tokenToAddressEditScene.enter(enterScene)
tokenToAddressEditScene.on('text', textHandler)
