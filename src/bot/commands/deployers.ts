import { menu } from '@/bot/controllers/deployers'

export default (_bot: any) => {
    /**
     * @command /deployers
     * deployers menu function
     */
    _bot.command('deployers', (ctx: any) => {
        ctx.session.mainMsgId = undefined
        menu(ctx)
    })
    /**
     * @action deployers
     * deployers menu function
     */
    _bot.action('deployers', menu)
}
