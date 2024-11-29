import { menu } from '@/bot/controllers/tokens'

export default (_bot: any) => {
    /**
     * @command /tokens
     * launcher menu function
     */
    _bot.command('tokens', (ctx: any) => {
        ctx.session.mainMsgId = undefined
        menu(ctx)
    })
    /**
     * @action start
     * start function
     */
    _bot.action('tokens', menu)
}
