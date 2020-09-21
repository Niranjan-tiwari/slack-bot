const {User} = require("../models")
module.exports = {

    sendMessage: async (bot, userId, message) => {
        await bot.startPrivateConversation(userId);

        await bot.say(message);
    },

    sendWelcomeMessage: (bot, userList) => {
        console.log("Sending welcome message");
        userList.map((user) => {
            let message = "";
            if (user.is_admin) {
                message = {
                    "text": `Howdy, *${user.real_name}* ! I am Taskvise :wave:.
                        \n *I can help you create and monitor daily tasks for your team*`,
                    "attachments": [
                        {
                            "text": "Create your first team task to put me into action.",
                            "fallback": "You are unable to choose a game",
                            "callback_id": "task_creation",
                            "color": "#3AA3E3",
                            "attachment_type": "default",
                            "actions": [
                                {
                                    "name": "game",
                                    "text": "Create a task",
                                    "type": "button",
                                    "value": "create_task"
                                }
                            ]
                        }
                    ]
                };
                module.exports.sendMessage(bot, user.user_id, message);
            }
        })
    },

    getUsersList: async(userList)=>{
       await userList.map((user)=>{
           return module.exports.getUserId(user);
        });

    },

    getUserId: async(user_id)=>{
      await User.findOne({user_id: user_id})
    }
};