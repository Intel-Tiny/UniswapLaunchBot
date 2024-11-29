import { menu } from '@/bot/controllers/launcher'
import { create_launch } from '@/bot/controllers/launcher/createLaunch.controller'
import { menu as menuManageLaunch } from '@/bot/controllers/launcher/manageLaunch.controller'
import { menu as menuLaunchToken } from '@/bot/controllers/launcher/launchToken.controller'

export default (_bot: any) => {
    _bot.action('launcher', menu)
    _bot.command('launcher', (ctx: any) => {
        ctx.session.mainMsgId = undefined
        menu(ctx)
    })

    _bot.action('launch_token', menuLaunchToken)
    _bot.action('create_launch', create_launch)
    _bot.action('manage_launch', menuManageLaunch)
}
