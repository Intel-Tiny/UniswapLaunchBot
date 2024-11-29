import { menu } from '@/bot/controllers/snipers'

export default (_bot: any) => {
    /**
     * @command /wallets
     * wallets menu function
     */
    _bot.command('wallets', (ctx: any) => {
        ctx.session.mainMsgId = undefined
        menu(ctx)
    })
    /**
     * @action wallets
     * wallets menu function
     */
    _bot.action('wallets', menu)
}
