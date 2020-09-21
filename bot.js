//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the taskvise bot.

// Import Botkit's core features
const {Botkit} = require('botkit');
const {BotkitCMSHelper} = require('botkit-plugin-cms');
const {Team, User, Task} = require('./models');
const bodyParser = require('body-parser');
const cors = require('cors');
const {sendWelcomeMessage} = require('./helper/welcomeMessage');
const debug = require('debug')('botkit:main');
const jwt = require('jsonwebtoken');

// Import a platform-specific adapter for slack.

const {SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware} = require('./slack-adapter');

const {MongoDbStorage} = require('botbuilder-storage-mongodb');
const mongoose = require('mongoose');

// Load process.env values from .env file
require('dotenv').config();

let storage = null;
let db = null;

if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI, {useUnifiedTopology: true, useCreateIndex: true, useNewUrlParser: true});

    db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        console.log('Mongoose: Connected');
    });
}


const adapter = new SlackAdapter({
    // REMOVE THIS OPTION AFTER YOU HAVE CONFIGURED YOUR APP!
    enable_incomplete: false,
    debug: true,
    // parameters used to secure webhook endpoint
    verificationToken: process.env.verificationToken,
    clientSigningSecret: process.env.clientSigningSecret,

    // auth token for a single-team app
    botToken: process.env.botToken,

    // credentials used to set up oauth for multi-team apps
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'],
    redirectUri: process.env.redirectUri,

    // functions required for retrieving team-specific info
    // for use in multi-team apps
    getTokenForTeam: getTokenForTeam,
    getBotUserByTeam: getBotUserByTeam
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());


const controller = new Botkit({
    webhook_uri: '/api/messages',
    debug: true,
    adapter: adapter,
    storage
});
controller.webserver.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
controller.webserver.use(bodyParser.json());
controller.webserver.use(bodyParser.urlencoded({extended: true}));
//const config = controller.getConfig();
//console.log(controller.webserver)
// Setup a static directory 'public', totally optional
controller.webserver.use(require('express').static(__dirname + '/views'))
const io = require('socket.io')(controller.http, {wsEngine: 'ws'});

const socketioJwt = require('socketio-jwt');
let teamData;
io.on('connection', socketioJwt.authorize({
    secret: process.env.secretKey,
    timeout: 15000 // 15 seconds to send the authentication message
})).on('authenticated', function (socket) {
    teamData = socket.decoded_token;
    console.log(teamData)
    //sendTeamDetails(teamData["team_id"]);

}).on("getData", (data) => {
    console.log(data);
});


// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {

    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');
    controller.loadModules(__dirname + '/skills');
});


controller.webserver.get('/', (req, res) => {

    res.render(__dirname + "./views/index.html")

});

controller.webserver.get('/install', (req, res) => {
    // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
    res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get('/install/auth', async (req, res) => {
    try {
        const results = await controller.adapter.validateOauthCode(req.query.code);

        //console.log('FULL OAUTH DETAILS', results);

        // Store token by team in bot state.
        /*storage.write({
              [results.team_id]: {
                bot_access_token: results.bot.bot_access_token,
                bot_user_id: results.bot.bot_user_id,
              },
            })*/

        const team = new Team({
            user_id: results.user_id,
            access_token: results.access_token,
            team_id: results.team_id,
            team_name: results.team_name,
            enterprise_id: results.enterprise_id,
            bot: results.bot
        });

        const teamData = {
            team_id: results.team_id,
            team_name: results.team_name,
            user_id: results.user_id
        };


        team.save(function (err) {
            if (err) {
                console.log(err);
                Team.findOneAndUpdate({team_id: results.team_id}, {
                    access_token: results.access_token,
                    bot: results.bot,
                    updated_date: Date.now()
                }, {new: true});
                console.log("Team updated");
                init(results, team);
            } else {
                console.log("Team saved");
                init(results, team);
            }
        });

        const token = jwt.sign(teamData, process.env.secretKey);
        res.redirect('http://localhost:8000/?token=' + token);

    } catch (err) {
        console.error('OAUTH ERROR:', err);
        res.status(401)
        res.send(err.message)
    }
});

controller.webserver.post('/team-data', (req, res) => {
    jwt.verify(req.headers.authorization, process.env.secretKey, function (err, decoded) {
        if (err) {
            res.status(400);
            res.send(err);
        } else {
            res.status(200);
            findTeamDetails(decoded.team_id).then(response => {
                res.send(response);
            }).catch(error => {
                console.error(error)
            })

        }
    });
});

async function findTeamDetails(teamId) {

    let teamData = await Team.findOne({team_id: teamId}).exec();

    let usersData = await User.find({team: teamData._id,is_bot: false})
        .populate("team").exec();
    let tasksData = await Task.find({team:teamData._id}).populate("assigned_to").exec();
    return {teamData: teamData, usersData: usersData, tasksData: tasksData};
}

async function init(results, team) {
    let bot = await controller.spawn(results.team_id);
    let ress = await bot.api.users.list({limit: 20});
    let users = [];
    let data = {};
    ress.members.map((user) => {
        data = {};
        if (!user.deleted) {
            data['user_id'] = user.id;
            data['team'] = team._id;
            data['user_name'] = user.name;
            data['real_name'] = user.profile.real_name;
            data['email'] = user.profile.email || null;
            data['is_bot'] = user.is_bot || user.id === "USLACKBOT";
            data['is_owner'] = user.is_owner;
            data['is_admin'] = user.is_admin;
            data['deleted'] = user.deleted;
            data['is_primary_owner'] = user.is_primary_owner;
            data['image_url'] = user.profile.image_512 || null;
            users.push(data);
        }
    });

    User.collection.insertMany(users)
        .then(r => {
            sendWelcomeMessage(bot, users);

        })
        .catch(e => {
            console.error(e);
        });
}

async function sendMessage(bot, user, message) {
    await bot.startPrivateConversation(user.id);
    await bot.say(message);
}

async function sendTeamDetails(teamId) {
    const team = await Team.findOne({team_id: teamId}).exec();

    if (team) {
        console.log("Sending teamData");
        setTimeout(() => {
            io.emit("team_data", team);
        }, 2000)

    }
}

async function getTokenForTeam(teamId) {
    const team = await Team.findOne({team_id: teamId}).exec();

    if (team && team.bot.bot_access_token) {
        //console.log("Token Cache " + teamId + " " + team.bot.bot_access_token);
        return team.bot.bot_access_token
    } else {
        console.error('Team not found in tokenCache: ', teamId);
    }
}

async function getBotUserByTeam(teamId) {
    const team = await Team.findOne({team_id: teamId}).exec();

    if (team && team.bot.bot_user_id) {
        //console.log("User Cache " + teamId + " " + team.bot.bot_user_id);
        return team.bot.bot_user_id
    } else {
        console.error('Team not found in userCache: ', teamId);
    }
}