var Botkit = require('botkit')
var http = require('http')

// Expect a SLACK_TOKEN environment variable

firebaseStorage = require('botkit-storage-firebase')({firebase_uri: 'https://demobot.firebaseIO.com'})
var controller = Botkit.slackbot({
    storage: firebaseStorage
});


var con = require('beepboop-botkit').start(controller)



var persona = {id:"default", persona_name:'Demo Bot', persona_icon: 'http://lorempixel.com/48/48'};


var morgan = require('morgan')

controller.setupWebserver(process.env.PORT,function(err,webserver) {
    controller.createWebhookEndpoints(webserver);
});

function cleanKey(key) {
    // strings and can't contain ".", "#", "$", "/", "[", or "]"
    return key.toLowerCase().replace(".","").replace("?","").replace("$","").replace("/","").replace("[","").replace("]","").replace("#","").trim()
}

controller.on('slash_command', function (bot, message) {
    console.log('Here is the actual slash command used: ', message.command);
    var team_id  = message.team_id;
    loadPersonality(team_id, function () {

        if(message.command == '/learn'){
            var learn = message.text
            var man_say = learn.substr(0, learn.indexOf("\n")-1);
            var bot_say = learn.substr(learn.indexOf("\n")+1);
            man_say = cleanKey(man_say);
            bot_say = bot_say.trim();
            if(man_say == "" || bot_say == ""){
                bot.replyPrivate(message, 'missing param - you say is ('+man_say+') I say is ('+bot_say+') ');
                return;
            }
            var  attachments = null;
            if(bot_say.indexOf('"attachments')>0){
                p_data = JSON.parse(bot_say);
                attachments = p_data["attachments"];
                bot_say  = "";
            }
            saving  = persona.id+'_voc/_'+man_say;
            console.log('Saving key, value: ', "["+saving+"],["+bot_say+"}", attachments );
            if(attachments != null){
                var learning = {id: saving, botsay: bot_say, attachments: attachments};
                controller.storage.teams.save(learning);
                bot.replyPrivate(message, 'When you say: '+man_say+' \n I will say: '+p_data)
            }else{
                var learning = {id: saving, botsay: bot_say};
                controller.storage.teams.save(learning);
                bot.replyPrivate(message, 'When you say: '+man_say+' \n I will say: '+bot_say)
            }

        }else if(message.command == '/new-persona'){

            var new_persona_id = cleanKey(message.text);
            controller.storage.teams.get(new_persona_id , function(err, val) {
                if(val != null){
                    bot.replyPrivate(message, 'I already have this persona');
                }else{
                    save_id = team_id+"_"+new_persona_id
                    new_persona = {id:save_id, persona_name:'Demo Bot', persona_icon: 'http://lorempixel.com/48/48'};
                    controller.storage.teams.save(new_persona);

                    var current_persona = {id: team_id+"_"+'current_persona', data: new_persona};
                    controller.storage.teams.save(current_persona);

                    load_id = team_id+"_personas"
                    controller.storage.teams.get(load_id , function(err, val) {
                        if(val != null){
                            val.data.push(new_persona_id)
                            controller.storage.teams.save(val);
                        }else{
                            var personas = {id: team_id+"_personas", data: [new_persona_id]};
                            controller.storage.teams.save(personas);
                        }
                    });

                    bot.replyPrivate(message, 'Created new persona - '+new_persona_id);
                }
            });

        }else if (message.command == '/load-persona'){
            var new_persona_id = cleanKey(message.text);
            load_id = team_id+"_"+new_persona_id
            controller.storage.teams.get(load_id , function(err, val) {
                if(val != null){
                    //console.log('loaded value, new_persona_id -', val, new_persona_id);
                    var current_persona = {id: team_id+"_"+'current_persona', data: val};
                    controller.storage.teams.save(current_persona);

                    bot.replyPrivate(message, 'Loaded new persona - '+val.id);
                }else{

                    // persona not found
                    bot.replyPrivate(message, 'I need my meds! could not find - '+new_persona_id);
                }
            });

        }else if (message.command == '/set-persona-name'){
            var new_persona_name = message.text.trim();
            controller.storage.teams.get(team_id+"_"+'current_persona', function(err, val) {
                if(val != null){
                    persona = val.data
                    val.data.persona_name = new_persona_name;
                    controller.storage.teams.save(val);
                    persona_id = val.data.id;
                    controller.storage.teams.get(persona_id, function(err, val1) {
                        if(val1 != null){
                            val1.persona_name = new_persona_name;
                            controller.storage.teams.save(val1);
                            bot.replyPrivate(message, 'From now on I shall be called Sir '+new_persona_name);

                        }
                    });
                }
            });

        }else if (message.command == '/list-personas'){
            controller.storage.teams.get(team_id+"_personas", function(err, val) {
                if(val != null){
                    bot.replyPrivate(message, 'Personas -  '+ val.data);
                }else{
                    bot.replyPrivate(message, 'No Personas');
                }
            });

        }else if (message.command == '/export-persona'){
            /*call_config = { filename: "persona_export.txt" , content: "hello world", filetype: 'text', channels: message.channel}
            bot.api.files.upload(call_config, function(err,res) {

                if (err) {
                    bot.replyPrivate(message, 'can not export!');
                    console.log(err, bot)
                    return;
                }
            });
            */

            bot.replyPrivate(message, 'coming soon!');
        }else if (message.command == '/set-persona-icon-url'){
            var new_persona_icon_url = message.text.trim();
            controller.storage.teams.get(team_id+"_"+'current_persona', function(err, val) {
                if(val != null){
                    persona = val.data
                    val.data.persona_icon = new_persona_icon_url;
                    controller.storage.teams.save(val);
                    persona_id = val.data.id;
                    controller.storage.teams.get(persona_id, function(err, val1) {
                        if(val1 != null){
                            val1.persona_icon = new_persona_icon_url;
                            controller.storage.teams.save(val1);
                            bot.replyPrivate(message, 'From now on I shall use a new icon - '+new_persona_icon_url);

                        }
                    });
                }
            });

        }else if (message.command == '/demo-setting'){
            var setting = message.text.trim();
            var key = setting.substring(0, setting.indexOf(" ")).trim();
            var value = setting.substring(setting.indexOf(" ")).trim();
            console.log('Saving key, value: ', "["+key+"],["+value+"]" );
            save_id = team_id+"_setting/"+key;
            new_persona = {id:save_id, value:value};
            controller.storage.teams.save(new_persona);
            bot.replyPublic(message, "");

        }else if (message.command == '/persona-set-notification'){

            var setting = message.text.trim();
            var key = setting.substring(0, setting.indexOf(" ")).trim();
            var interval = setting.substring(setting.indexOf(" "),setting.indexOf("\n")).trim();
            var bot_say = learn.substr(setting.indexOf("\n")+1);
            console.log('Saving notification key, interval, bot_say - ', "["+key+"],["+interval+"],["+bot_say+"]" );
            //save_id = team_id+"_notification/"+key;
            //new_persona = {id:save_id, value:value};
            //controller.storage.teams.save(new_persona);

            bot.replyPublic(message, "");

        }else if (message.command == '/pin-persona'){
            var channel = message.channel;

            controller.storage.teams.get(team_id+"_"+'current_persona', function(err, val) {
                if(val != null){
                    persona = val.data
                    console.log('Saving persona, channel: ', "["+persona+"],["+channel+"]" );
                    save_id = team_id+"_pin/"+channel;
                    pin_persona = {id:save_id, value:persona};
                    controller.storage.teams.save(pin_persona);
                    bot.replyPublic(message, 'Saving persona, channel: ', "["+persona+"],["+channel+"]" );

                }
            })

    }else{
            bot.replyPublic(message, "");

        }
    });


});

/*
beepboop.on('botkit.rtm.started', function (bot, resource, meta) {
    var slackUserId = resource.SlackUserID

    if (meta.isNew && slackUserId) {
        bot.api.im.open({ user: slackUserId }, function (err, response) {
            if (err) {
                return console.log(err)
            }
            var dmChannel = response.channel.id
            bot.say({channel: dmChannel, text: 'Thanks for adding me to your team!'})
            bot.say({channel: dmChannel, text: 'You can now /invite me to a channel, so that I can be of use to the team, or DM/@wordsbot me anytime!'})
        })
    }
})
*/




controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, ":wave: team -  I am your demo bot. \n I support direct mentions and DMs, I will read what is in this channel and try to respond accordingly -  you can also `@demobot: help` me.")
})



//controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
//    bot.reply(message, ':wave:')
//})




controller.hears(['^help$'], ['direct_message', 'direct_mention'], function (bot, message) {
    bot.reply(message, helpText)
})


controller.hears('.*', ['direct_message', 'direct_mention', 'ambient'], function (bot, message) {
    console.log('msg - ', message);
    var team_id = message.team;
    loadPersonality(team_id, function () {
        man_say = cleanKey(message.text);
        loading  = persona.id+'_voc/_'+man_say;
        console.log('Loading key: ', "["+loading+"]");

        controller.storage.teams.get(loading, function(err, val) {
            console.log("got value" , val)
            if(val == undefined){
                console.log('what should I say when you say "'+man_say+'"');
                if(message.event != "ambient"){
                    bot.reply(message, compose('what should I say when you say "'+man_say+'"? not sure... \n Please use /learn to teach me new tricks!', [] ));
                }
            }else{
                resp = val["botsay"].toString();
                var attach = val["attachments"];
                if(attach == undefined || attach == null){
                    attach = []
                }
                bot.reply(message, compose(resp, attach) )
            }
        });

    });


})


function compose(text, attachments){
    console.log('compose for persona ', persona);
    var reply_with_attachments = {
        'username': persona.persona_name ,
        'text': text,
        'attachments': attachments,
        'icon_url': persona.persona_icon
    }
    return reply_with_attachments;

}

function loadPersonality(team_id, callback) {
    console.log('loadPersonality ');
    controller.storage.teams.get(team_id+"_"+'current_persona', function(err, val) {
        if(val != null){
            persona = val.data
            console.log('calling callback', val.data);
            callback();
        }else{
            save_id = team_id+"_default"
            new_persona = {id:save_id, persona_name:'Demo Bot', persona_icon: 'http://lorempixel.com/48/48'};
            controller.storage.teams.save(new_persona);
            var current_persona = {id: team_id+"_"+'current_persona', data: new_persona};
            controller.storage.teams.save(current_persona);
            persona = current_persona.data;
            personas = {id: team_id+"_personas", data: ["default"]};
            controller.storage.teams.save(personas);
            callback();
        }
    });
}


function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

var helpText = ' *What is the Demo Bot* \n'+
':robot_face: The Demo Bot is an easy to script bot - you simply talk to the bot and teach it what to answer when you say something. The Demo bot supports multiple scripts (personalities) alongside the ability to change it’s name and icon for each. \n'+
'\n*How to use the Demo Bot*'+
'> The bot can learn to reply to any text you send, either in DM or in channel in which the bot was invited to.\n'+
'\n*Working with your bot*\n'+
'* Add the bot to your team and invite it to the appropriate channels (https://beepboophq.com/bots/1d563b4601d44aeca2bda92547894460).\n'+
'* Use `/new-persona [persona name]` to start a new script (this will automatically switch to the newly created persona)\n'+
'* Use `/set-persona-name [display name]` to set the name the bot will use to display in this script\n'+
'* Use `/set-persona-icon-url [URL]` to set the icon the bot will use in this script.\n'+
    '* Use `/list-personas` list known personas.\n'+
    '* Use `/load-persona [persona name]` to switch between scripts\n'+
    '* Use `/learn [you say] \\n [bot say]` to teach the bot new tricks, see _Training  your bot_ for more details.\n'+
        '* Run the script by just saying your part of the script the let the bot follow\n'+
        '\n*Training  your bot*\n'+
        'Use the `/learn [you say] \n [bot say]` slash command to teach the bot what to say. Note the new-line between what you say and what the bot say (Use `shift`+`enter`)\n'+
        'Here are a few examples:\n'+
            '* Human say “wazzap?” the bot will say ":wave: all good" -\n'+
        '`/learn wazzap?`\n'+
         '`:wave: all good`\n'+
        '* Human say “/report xyz” the bot will say “:dollar: 500K made this week" - \n'+
            '`/learn /report xyz`\n'+
            '`:dollar: 500K made this week`\n'+
        '* Human say “complex” the bot will say _something complex with attachments_ -\n'+
        '`/learn complex`\n'+
            '`{Jason with attachments}`\n'+
        '> Best way to train the demo bot is DMing it. When the bot does not know what to say in DM, it will give you feedback, the bot will say nothing if it does not know what to say in a channel.\n';

