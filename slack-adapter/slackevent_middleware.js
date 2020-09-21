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
 * This middleware causes Botkit to emit message events by their `type` or `subtype` field rather than their default BotBuilder Activity type (limited to message or event).
 * This keeps the new Botkit behavior consistent withprevious versions, and provides helpful filtering on the many event types that Slack sends.
 * To use this, bind it to the adapter before creating the Botkit controller:
 * ```javascript
 * const adapter = new SlackAdapter(options);
 * adapter.use(new SlackEventMiddleware());
 * const controller = new Botkit({
 *      adapter: adapter,
 *      // ...
 * });
 *
 * // can bind directly to channel_join (which starts as a message with type message and subtype channel_join)
 * controller.on('channel_join', async(bot, message) => {
 *  // send a welcome
 * });
 * ```
 */
class SlackEventMiddleware extends botbuilder_1.MiddlewareSet {
    /**
     * Not for direct use - implements the MiddlewareSet's required onTurn function used to process the event
     * @param context
     * @param next
     */
    onTurn(context, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context.activity.type === botbuilder_1.ActivityTypes.Event && context.activity.channelData) {
                // Handle message sub-types
                if (context.activity.channelData.subtype) {
                    context.activity.channelData.botkitEventType = context.activity.channelData.subtype;
                }
                else if (context.activity.channelData.type) {
                    context.activity.channelData.botkitEventType = context.activity.channelData.type;
                }
            }
            yield next();
        });
    }
}
exports.SlackEventMiddleware = SlackEventMiddleware;
//# sourceMappingURL=slackevent_middleware.js.map