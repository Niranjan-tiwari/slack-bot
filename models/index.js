const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// come back here if we need to change or add fields to the schema
const teamSchema = new Schema({
    user_id: {
        type: String,
        required: false
    },
    access_token: String,
    team_name: {
        type: String,
        required: true
    },
    team_id: {
        type: String,
        required: true,
        unique: true
    },
    enterprise_id: {
        type: String,
        required: false
    },
    bot: {
        bot_user_id: String,
        bot_access_token: String
    },
    active: {
        type: Boolean,
        default: false
    },
    created_date: {
        type: Date,
        default: Date.now
    },
    updated_date: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
    active: {
        type: Boolean,
        default: false
    },
    user_id: {
        type: String,
        required: true,
        unique: true,
    },
    user_name: String,
    email: String,
    team: {
        type: Schema.Types.ObjectId, ref: 'team'
    },
    image_url: String,
    real_name: String,

    deleted: Boolean,
    is_bot: {
        type: Boolean,
        default: false
    },
    is_owner: {
        type: Boolean,
        default: false
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    is_primary_owner: {
        type: Boolean,
        default: false
    },
    created_date: {
        type: Date,
        default: Date.now()
    },
    updated_date: {
        type: Date,
        default: Date.now
    }
});

const taskSchema = new mongoose.Schema({
    active: {
        type: Boolean,
        default: false
    },
    task_title: {
        type: String,
        required: true
    },
    task_desc: {
        type: String,
        required: true
    },
    creator_user: {
        type: Schema.Types.ObjectId, ref: "user"
    },
    team: {type: Schema.Types.ObjectId, ref: 'team'},
    assigned_to: [
        {
            type: Schema.Types.ObjectId, ref: 'user'
        }
    ],
    due_by: {
        type: Date,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    created_date: {
        type: Date,
        default: Date.now()
    },
    updated_date: {
        type: Date,
        default: Date.now
    }
})

// create the mongoose document
const Team = mongoose.model('team', teamSchema);
const User = mongoose.model('user', userSchema);
const Task = mongoose.model('task', taskSchema);

module.exports = {
    Team: Team,
    User: User,
    Task: Task
};