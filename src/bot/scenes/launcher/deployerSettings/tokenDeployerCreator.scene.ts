import { Scenes, Context } from 'telegraf'
import { enterScene, callbackQuery } from '@/bot/controllers/share/deployers/tokenDeployerCreate.controller'

export const tokenDeployerCreatorScene = new Scenes.BaseScene<Context>('tokenDeployerCreatorScene')

tokenDeployerCreatorScene.enter(enterScene)
tokenDeployerCreatorScene.on('callback_query', callbackQuery)
