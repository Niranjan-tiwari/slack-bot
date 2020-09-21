"use strict";
/**
 * @module botbuilder-adapter-slack
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
/**
 * A middleware for Botkit developers using the BotBuilder SlackAdapter class.
 * This middleware causes Botkit to emit more specialized events for the different types of message that Slack might send.
 * Responsible for classifying messages:
 *
 *      * `direct_message` events are messages received through 1:1 direct messages with the bot
 *      * `direct_mention` events are messages that start with a mention of the bot, i.e "@mybot hello there"
 *      * `mention` events are messages that include a mention of the bot, but not at the start, i.e "hello there @mybot"
 *
 * In addition, messages from bots and changing them to `bot_message` events. All other types of message encountered remain `message` events.
 *
 * To use this, bind it to the adapter before creating the Botkit controller:
 * ```javascript
 * const adapter = new SlackAdapter(options);
 * adapter.use(new SlackMessageTypeMiddleware());
 * const controller = new Botkit({
 *      adapter: adapter,
 *      // ...
 * });
 * ```
 */
class SlackMessageTypeMiddleware extends botbuilder_1.MiddlewareSet {
    /**
     * Not for direct use - implements the MiddlewareSet's required onTurn function used to process the event
     * @param context
     * @param next
     */
    onTurn(context, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context.activity.type === 'message' && context.activity.channelData) {
                let adapter = context.adapter;
                const bot_user_id = yield adapter.getBotUserByTeam(context.activity);
                var mentionSyntax = '<@' + bot_user_id + '(\\|.*?)?>';
                var mention = new RegExp(mentionSyntax, 'i');
                var direct_mention = new RegExp('^' + mentionSyntax, 'i');
                // is this a DM, a mention, or just ambient messages passing through?
                if (context.activity.channelData.channel_type && context.activity.channelData.channel_type === 'im') {
                    context.activity.channelData.botkitEventType = 'direct_message';
                    // strip any potential leading @mention
                    context.activity.text = context.activity.text.replace(direct_mention, '')
                        .replace(/^\s+/, '').replace(/^:\s+/, '').replace(/^\s+/, '');
                }
                else if (bot_user_id && context.activity.text && context.activity.text.match(direct_mention)) {
                    context.activity.channelData.botkitEventType = 'direct_mention';
                    // strip the @mention
                    context.activity.text = context.activity.text.replace(direct_mention, '')
                        .replace(/^\s+/, '').replace(/^:\s+/, '').replace(/^\s+/, '');
                }
                else if (bot_user_id && context.activity.text && context.activity.text.match(mention)) {
                    context.activity.channelData.botkitEventType = 'mention';
                }
                else {
                    // this is an "ambient" message
                }
                // if this is a message from a bot, we probably want to ignore it.
                // switch the botkit event type to bot_message
                // and the activity type to Event <-- will stop it from being included in dialogs
                // NOTE: This catches any message from any bot, including this bot.
                // Note also, bot_id here is not the same as bot_user_id so we can't (yet) identify messages originating from this bot without doing an additional API call.
                if (context.activity.channelData && context.activity.channelData.bot_id) {
                    context.activity.channelData.botkitEventType = 'bot_message';
                    context.activity.type = botbuilder_1.ActivityTypes.Event;
                }
            }
            yield next();
        });
    }
}
exports.SlackMessageTypeMiddleware = SlackMessageTypeMiddleware;
//# sourceMappingURL=messagetype_middleware.js.map