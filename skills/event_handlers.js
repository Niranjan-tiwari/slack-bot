const {SlackDialog} = require('../slack-adapter');
const {Task, User, Team} = require("../models");
const {getUsersList} = require('../helper/welcomeMessage')

module.exports = function (controller) {
    controller.on('message', async (bot, message) => {
        console.log(message);
        if (message.callback_id === "task_creation") {
            await bot.replyWithModal(message, {
                "type": "modal",
                "callback_id": "create_a_task",
                "title": {
                    "type": "plain_text",
                    "text": "CREATE TASK",
                    "emoji": true
                },
                "submit": {
                    "type": "plain_text",
                    "text": "Submit",
                    "emoji": true
                },
                "close": {
                    "type": "plain_text",
                    "text": "Cancel",
                    "emoji": true
                },
                "blocks": [
                    {
                        "type": "input",
                        "block_id": "task_title",
                        "element": {
                            "type": "plain_text_input",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Add a title for your task"
                            }
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "Title",
                            "emoji": true
                        }
                    },
                    {
                        "type": "input",
                        "block_id": "task_description",
                        "element": {
                            "type": "plain_text_input",
                            "multiline": true,
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Add a detailed description"
                            }
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "Description",
                            "emoji": true
                        }
                    },
                    {
                        "type": "input",
                        "block_id": "task_assigned_to",
                        "label": {
                            "type": "plain_text",
                            "text": "Assign to",
                            "emoji": true
                        },
                        "element": {
                            "type": "multi_users_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Pick some team members"
                            }
                        }
                    },
                    {
                        "type": "input",
                        "block_id": "task_priority",
                        "label": {
                            "type": "plain_text",
                            "text": "Priority",
                            "emoji": true
                        },
                        "element": {
                            "type": "static_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Pick some team members"
                            },
                            "options": [
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "A message *with some bold text* and _some italicized text_."
                                    },
                                    "value": "value-0"
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "*this is plain_text text*"
                                    },
                                    "value": "value-1"
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "*this is plain_text text*"
                                    },
                                    "value": "value-2"
                                }
                            ]
                        }
                    },
                    {
                        "type": "input",
                        "block_id": "task_due_by",
                        "element": {
                            "type": "datepicker",
                            "initial_date": new Date().toISOString().split('T')[0],
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select a date",
                                "emoji": true
                            }
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "Due by",
                            "emoji": true
                        }
                    }
                ]
            })
        } else if (message.callback_id === "task_approve") {
            await bot.replyInteractive(message, '[ A previous message was successfully replaced with this less exciting one. ]');
        } else if (message.callback_id === "task_edit") {

        }
    });


    controller.on('view_submission', async (bot, message) => {
        console.log("View Submission")
        //console.log(JSON.stringify(message));
        let view = message.view;

        if (view && view.callback_id === "create_a_task") {
            let state = view.state;
            let values = state.values;
            let taskTitle = Object.values(values["task_title"])[0]["value"];
            let taskDescription = Object.values(values["task_description"])[0]["value"];
            let taskDueBy = Object.values(values["task_due_by"])[0]["selected_date"];
            let taskAssignedTo = Object.values(values["task_assigned_to"])[0]["selected_users"];
            let creator_user = await User.findOne({user_id: message.user});
            let team = await Team.findOne({team_id: message.team.id});
            creator_user = JSON.parse(JSON.stringify(creator_user))
            let assigned_users = [];
            let assigned_to = ``;

            taskAssignedTo.map((user) => {

                User.findOne({user_id: user}).then(usr => {
                    usr = JSON.parse(JSON.stringify(usr));
                    assigned_users.push(usr._id);
                    let task = new Task({
                        task_title: taskTitle,
                        task_desc: taskDescription,
                        creator_user: creator_user,
                        team: team,
                        assigned_to: assigned_users,
                        due_by: taskDueBy
                    });
                    if (assigned_users.length === taskAssignedTo.length) {
                        task.save(function (err) {
                            if (err) console.log("Task creation failed", err)
                            else {
                                console.log("Task creation successful");

                            }
                        })
                    }
                }).catch(err => {
                    console.log("User not found", err);
                });
            })

            assigned_to = taskAssignedTo.map(user => {
                return ` <@${user}>`
            })


            await bot.startPrivateConversation(message.user);
            let numTasks = await Task.find({creator_user: creator_user._id});
            let msg = {};
            if (numTasks.length === 1) {
                msg = {
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": `Congratulations you have successfully created your first task :tada: :clap:\n*${taskTitle}*`
                            }
                        },
                        {
                            "type": "section",
                            "fields": [
                                {
                                    "type": "mrkdwn",
                                    "text": `:clipboard: *Description:*\n${taskDescription}`
                                }
                            ]
                        },
                    ],
                    "attachments": [
                        {
                            "color": "#3AA3E3",
                            "blocks": [

                                {
                                    "type": "section",
                                    "fields": [
                                        {
                                            "type": "mrkdwn",
                                            "text": `:bust_in_silhouette: *Assigned to:*\n${assigned_to.join()}\n`
                                        }
                                    ]
                                },
                                {
                                    "type": "section",
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": `:date: *Due Date* ${new Date(taskDueBy).toDateString()}\n`
                                    }
                                },
                                {
                                    "type": "actions",
                                    "elements": [
                                        {
                                            "type": "button",
                                            "text": {
                                                "type": "plain_text",
                                                "emoji": true,
                                                "text": "Approve"
                                            },
                                            "style": "primary",
                                            "value": "approve"
                                        },
                                        {
                                            "type": "button",
                                            "text": {
                                                "type": "plain_text",
                                                "emoji": true,
                                                "text": "Edit"
                                            },
                                            "style": "danger",
                                            "value": "edit"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                };
            }
            else {
                msg = {
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": `*${taskTitle}*`
                            }
                        },
                        {
                            "type": "section",
                            "fields": [
                                {
                                    "type": "mrkdwn",
                                    "text": `:clipboard: *Description:*\n${taskDescription}`
                                }
                            ]
                        },
                    ],
                    "attachments": [
                        {
                            callback_id: '123',
                            "color": "#3AA3E3",
                            "blocks": [

                                {
                                    "type": "section",
                                    "fields": [
                                        {
                                            "type": "mrkdwn",
                                            "text": `:bust_in_silhouette: *Assigned to:*\n${assigned_to.join()}\n`
                                        }
                                    ]
                                },
                                {
                                    "type": "section",
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": `:date: *Due Date* ${new Date(taskDueBy).toDateString()}\n`
                                    }
                                },
                                {
                                    "type": "actions",

                                    "elements": [
                                        {
                                            "type": "button",
                                            "text": {
                                                "type": "plain_text",
                                                "emoji": true,
                                                "text": "Approve"
                                            },
                                            "style": "primary",
                                            "value": "approve"
                                        },
                                        {
                                            "type": "button",
                                            "text": {
                                                "type": "plain_text",
                                                "emoji": true,
                                                "text": "Edit"
                                            },
                                            "style": "danger",
                                            "value": "edit"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                };
            }
            console.log(assigned_to.join())
            await bot.say(msg);
        }

    });


}