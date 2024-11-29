import { Scenes, Context } from 'telegraf'
import { enterScene, textHandler } from '@/bot/controllers/launcher/launchTokenomics/tokenContractFundsEdit.controller'

export const tokenFundsEditScene = new Scenes.BaseScene<Context>('tokenFundsEditScene')

tokenFundsEditScene.enter(enterScene)
tokenFundsEditScene.on('text', textHandler)
