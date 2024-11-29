import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchDeployers/sendEthReceiverAddressEdit.controller'

export const ethToAddressEditScene = new Scenes.BaseScene<Context>('ethToAddressEditScene')

ethToAddressEditScene.enter(enterScene)
ethToAddressEditScene.on('text', textHandler)
