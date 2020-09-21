/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = function(controller) {

    controller.hears('sample','message,direct_message', async(bot, message) => {
        await bot.reply(message, 'I heard a sample message.');
        // bot.say({
        //     user: 'UNN4DBM39',
        //     text: "hi"
        // });

        bot.api.chat.postMessage({channel: 'UNN4DBM39', text: 'Welcome', as_user: true}, function (err, response) {
            // Process postMessage error and response
        })

        await bot.startPrivateConversation('UNN4DBM39');

        await bot.say(`Let's talk in private.`);
        
        //console.log(message);
        //console.log(message);
        // bot.api.im.open({
        //     user: 'UMZKQTHPS'
        // }, (err, res) => {
        //     if (err) {
        //         console.log('Failed to open IM with user', err)
        //     }else{
        //     console.log(res);
        //     bot.startConversation({
        //         user: 'UMZKQTHPS',
        //         channel: res.channel.id,
        //         text: 'WOWZA... 1....2'
        //     }, (err, convo) => {
        //         convo.say('This is the shit')
        //     });
        // }
        // })
    });

}
