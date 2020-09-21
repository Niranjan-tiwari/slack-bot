"use strict";
/**
 * @module botbuilder-adapter-slack
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
const botkit_1 = require("botkit");
const request = require("request");
/**
 * This is a specialized version of [Botkit's core BotWorker class](core.md#BotWorker) that includes additional methods for interacting with Slack.
 * It includes all functionality from the base class, as well as the extension methods below.
 *
 * When using the SlackAdapter with Botkit, all `bot` objects passed to handler functions will include these extensions.
 */
class SlackBotWorker extends botkit_1.BotWorker {
    /**
     * Reserved for use internally by Botkit's `controller.spawn()`, this class is used to create a BotWorker instance that can send messages, replies, and make other API calls.
     *
     * When used with the SlackAdapter's multi-tenancy mode, it is possible to spawn a bot instance by passing in the Slack workspace ID of a team that has installed the app.
     * Use this in concert with [startPrivateConversation()](#startPrivateConversation) and [changeContext()](core.md#changecontext) to start conversations
     * or send proactive alerts to users on a schedule or in response to external events.
     *
     * @param botkit The Botkit controller object responsible for spawning this bot worker
     * @param config Normally, a DialogContext object.  Can also be the id of a team.
     */
    constructor(botkit, config) {
        // allow a teamid to be passed in
        if (typeof config === 'string') {
            const team_id = config;
            config = {
                // an activity is required to spawn the bot via the api
                activity: {
                    conversation: {
                        team: team_id
                    }
                },
                // a reference is used to spawn an api instance inside the adapter...
                reference: {
                    conversation: {
                        team: team_id
                    }
                }
            };
        }
        super(botkit, config);
    }
    /**
     * Switch a bot's context to a 1:1 private message channel with a specific user.
     * After calling this method, messages sent with `bot.say` and any dialogs started with `bot.beginDialog` will occur in this new context.
     *
     * ```javascript
     * controller.hears('dm me', 'message', async(bot, message) => {
     *
     *      // switch to a 1:1 conversation in a DM
     *      await bot.startPrivateConversation(message.user);
     *
     *      // say hello
     *      await bot.say('We are in private now...');
     *      await bot.beginDialog(MY_PRIVATE_DIALOG);
     *
     * });
     * ```
     *
     * Also useful when sending pro-active messages such as those sent on a schedule or in response to external events:
     * ```javascript
     * // Spawn a worker with a Slack team id.
     * let bot = await controller.spawn(SLACK_TEAM_ID);
     *
     * // Set the context for the bot's next action...
     * await bot.startPrivateConversation(SLACK_ADMIN_USER);
     *
     * // Begin a dialog in the 1:1 context
     * await bot.beginDialog(ALERT_DIALOG);
     * ```
     *
     * @param userId A Slack user id, like one found in `message.user` or in a `<@mention>`
     */
    startPrivateConversation(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // create the new IM channel
            const channel = yield this.api.im.open({ user: userId });
            if (channel.ok === true) {
                // now, switch contexts
                return this.changeContext({
                    conversation: {
                        id: channel.channel.id,
                        // @ts-ignore this field is required for slack
                        team: this.getConfig('activity').conversation.team
                    },
                    user: { id: userId, name: null },
                    channelId: 'slack'
                });
            }
            else {
                console.error(channel);
                throw new Error('Error creating IM channel');
            }
        });
    }
    /**
     * Switch a bot's context into a different channel.
     * After calling this method, messages sent with `bot.say` and any dialogs started with `bot.beginDialog` will occur in this new context.
     *
     * ```javascript
     * controller.hears('dm me', 'message', async(bot, message) => {
     *
     *      // switch to the channel specified in SLACK_CHANNEL_ID
     *      // if just using bot.say and not starting a dialog, can use a fake value for user id.
     *      await bot.startConversationInChannel(SLACK_CHANNEL_ID, message.user);
     *
     *      // say hello
     *      await bot.say('Shall we discuss this matter over here?');
     *      // ... continue...
     *      await bot.beginDialog(ANOTHER_DIALOG);
     *
     * });
     * ```
     * @param channelId A Slack channel id, like one found in `message.channel`
     * @param userId A Slack user id, like one found in `message.user` or in a `<@mention>`
     */
    startConversationInChannel(channelId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.changeContext({
                conversation: {
                    id: channelId,
                    // @ts-ignore this field is required for slack
                    team: this.getConfig('activity').conversation.team
                },
                user: { id: userId, name: null },
                channelId: 'slack'
            });
        });
    }
    /**
     * Switch a bot's context into a specific sub-thread within a channel.
     * After calling this method, messages sent with `bot.say` and any dialogs started with `bot.beginDialog` will occur in this new context.
     *
     * ```javascript
     * controller.hears('in a thread', 'message', async(bot, message) => {
     *
     *      // branch from the main channel into a side thread associated with this message
     *      await bot.startConversationInThread(message.channel, message.user, message.ts);
     *
     *      // say hello
     *      await bot.say(`Let's handle this offline...`);
     *      // ... continue...
     *      await bot.beginDialog(OFFLINE_DIALOG);
     *
     * });
     * ```
     * @param channelId A Slack channel id, like one found in `message.channel`
     * @param userId A Slack user id, like one found in `message.user` or in a `<@mention>`
     * @param thread_ts A thread_ts value found in the `message.thread_ts` or `message.ts` field.
     */
    startConversationInThread(channelId, userId, thread_ts) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.changeContext({
                conversation: {
                    id: channelId,
                    // @ts-ignore this field is required for slack
                    thread_ts: thread_ts,
                    team: this.getConfig('activity').conversation.team
                },
                user: { id: userId, name: null },
                channelId: 'slack'
            });
        });
    }
    /**
     * Like bot.reply, but as a threaded response to the incoming message rather than a new message in the main channel.
     * @param src an incoming message object
     * @param resp an outgoing message object (or part of one or just reply text)
     */
    replyInThread(src, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            // make sure the  thread_ts setting is set
            // this will be included in the conversation reference
            src.incoming_message.conversation.thread_ts = src.incoming_message.channelData.thread_ts ? src.incoming_message.channelData.thread_ts : src.incoming_message.channelData.ts;
            return this.reply(src, resp);
        });
    }
    /**
     * Like bot.reply, but sent as an "ephemeral" message meaning only the recipient can see it.
     * Uses [chat.postEphemeral](https://api.slack.com/methods/chat.postEphemeral)
     * @param src an incoming message object
     * @param resp an outgoing message object (or part of one or just reply text)
     */
    replyEphemeral(src, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            // make rure resp is in an object format.
            resp = this.ensureMessageFormat(resp);
            // make sure ephemeral is set
            // fields set in channelData will end up in the final message to slack
            resp.channelData = Object.assign(Object.assign({}, resp.channelData), { ephemeral: true });
            return this.reply(src, resp);
        });
    }
    /**
     * Like bot.reply, but used to send an immediate public reply to a /slash command.
     * The message in `resp` will be displayed to everyone in the channel.
     * @param src an incoming message object of type `slash_command`
     * @param resp an outgoing message object (or part of one or just reply text)
     */
    replyPublic(src, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = this.ensureMessageFormat(resp);
            msg.channelData.response_type = 'in_channel';
            return this.replyInteractive(src, msg);
        });
    }
    ;
    /**
     * Like bot.reply, but used to send an immediate private reply to a /slash command.
     * The message in `resp` will be displayed only to the person who executed the slash command.
     * @param src an incoming message object of type `slash_command`
     * @param resp an outgoing message object (or part of one or just reply text)
     */
    replyPrivate(src, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = this.ensureMessageFormat(resp);
            msg.channelData.response_type = 'ephemeral';
            msg.channelData.to = src.user;
            return this.replyInteractive(src, msg);
        });
    }
    ;
    /**
     * Like bot.reply, but used to respond to an `interactive_message` event and cause the original message to be replaced with a new one.
     * @param src an incoming message object of type `interactive_message`
     * @param resp a new or modified message that will replace the original one
     */
    replyInteractive(src, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!src.incoming_message.channelData.response_url) {
                throw Error('No response_url found in incoming message');
            }
            else {
                let msg = this.ensureMessageFormat(resp);
                // @ts-ignore
                msg.conversation = {
                    id: src.channel
                };
                msg.channelData.to = src.user;
                // if source message is in a thread, reply should also be in the thread
                if (src.incoming_message.channelData.thread_ts) {
                    // @ts-ignore
                    msg.conversation.thread_ts = src.incoming_message.channelData.thread_ts;
                }
                msg = this.controller.adapter.activityToSlack(msg);
                var requestOptions = {
                    uri: src.incoming_message.channelData.response_url,
                    method: 'POST',
                    json: msg
                };
                return new Promise(function (resolve, reject) {
                    request(requestOptions, function (err, res, body) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(body);
                        }
                    });
                });
            }
        });
    }
    ;
    /**
     * Return 1 or more error to a `dialog_submission` event that will be displayed as form validation errors.
     * Each error must be mapped to the name of an input in the dialog.
     * @param errors 1 or more objects in form {name: string, error: string}
     */
    dialogError(errors) {
        if (!errors) {
            errors = [];
        }
        if (!Array.isArray(errors)) {
            errors = [errors];
        }
        this.httpBody(JSON.stringify({ errors }));
    }
    ;
    /**
     * Reply to a button click with a request to open a dialog.
     * @param src An incoming `interactive_callback` event containing a `trigger_id` field
     * @param dialog_obj A dialog, as created using [SlackDialog](#SlackDialog) or [authored to this spec](https://api.slack.com/dialogs).
     */
    replyWithDialog(src, dialog_obj) {
        return __awaiter(this, void 0, void 0, function* () {
            var msg = {
                trigger_id: src.trigger_id,
                dialog: dialog_obj
            };
            return this.api.dialog.open(msg);
        });
    }
    ;
    /**
     * Reply to a button click with a request to open a modal.
     * @param src An incoming `interactive_callback` event containing a `trigger_id` field
     * @param view_obj A View, or [authored to this spec](https://api.slack.com/views).
     */
    replyWithModal(src, view_obj) {
        return __awaiter(this, void 0, void 0, function* () {
            var msg = {
                trigger_id: src.trigger_id,
                view: view_obj
            };
            return this.api.views.open(msg);
        });
    }
    ;
    /**
     * Update an existing message with new content.
     *
     * ```javascript
     * // send a reply, capture the results
     * let sent = await bot.reply(message,'this is my original reply...');
     *
     * // update the sent message using the sent.id field
     * await bot.updateMessage({
     *      text: 'this is an update!',
     *      ...sent
     * })
     * ```
     *
     * @param update An object in the form `{id: <id of message to update>, conversation: { id: <channel> }, text: <new text>, card: <array of card objects>}`
     */
    updateMessage(update) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.controller.adapter.updateActivity(this.getConfig('context'), update);
        });
    }
    /**
     * Delete an existing message.
     *
     * ```javascript
     * // send a reply, capture the results
     * let sent = await bot.reply(message,'this is my original reply...');
     *
     * // delete the sent message using the sent.id field
     * await bot.deleteMessage(sent);
     * ```
     *
     * @param update An object in the form of `{id: <id of message to delete>, conversation: { id: <channel of message> }}`
     */
    deleteMessage(update) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.controller.adapter.deleteActivity(this.getConfig('context'), {
                activityId: update.id,
                conversation: update.conversation
            });
        });
    }
}
exports.SlackBotWorker = SlackBotWorker;
//# sourceMappingURL=botworker.js.map