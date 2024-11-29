import { callbackQuery, start } from '@/bot/controllers/main'
import { Update } from '@telegraf/types'
import { Context, Telegraf } from 'telegraf'

export default (_bot: Telegraf<Context<Update>>) => {
    /**
     * @command /start
     * start function
     */
    _bot.command('start', (ctx: any) => {
        ctx.session.mainMsgId = undefined
        start(ctx)
    })
    /**
     * @action start
     * start function
     */
    _bot.action('start', start)

    // callback
    _bot.on('callback_query', callbackQuery)
}
