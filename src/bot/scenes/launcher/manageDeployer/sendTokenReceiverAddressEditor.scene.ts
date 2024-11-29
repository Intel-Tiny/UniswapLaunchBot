import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchDeployers/sendTokenReceiverAddressEdit.controller'

export const tokenDeployerAddrEditScene = new Scenes.BaseScene<Context>('tokenDeployerAddrEditScene')

tokenDeployerAddrEditScene.enter(enterScene)
tokenDeployerAddrEditScene.on('text', textHandler)
