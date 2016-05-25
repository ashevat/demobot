var Botkit = require('botkit')
var http = require('http')

// Expect a SLACK_TOKEN environment variable

//
firebaseStorage = require('botkit-storage-firebase')({firebase_uri: 'https://demobot.firebaseIO.com'})
var controller = Botkit.slackbot({
    storage: firebaseStorage
});


//var controller = Botkit.slackbot()
var con = require('beepboop-botkit').start(controller)
//var kv = require('beepboop-persist')()




controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
    bot.reply(message, 'Hello :wave:. ')
})

























var persona = {id:"default", persona_name:'Demo Bot', persona_icon: 'http://lorempixel.com/48/48'};


var morgan = require('morgan')

controller.setupWebserver(process.env.PORT,function(err,webserver) {
    controller.createWebhookEndpoints(webserver);
});

controller.on('slash_command', function (bot, message) {
    console.log('Here is the actual slash command used: ', message.command);
    var team_id  = message.team_id;
    loadPersonality(team_id, function () {

        if(message.command == '/learn'){
            var learn = message.text
            var man_say = learn.substr(0, learn.indexOf("\n")-1);
            var bot_say = learn.substr(learn.indexOf("\n")+1);
            man_say = man_say.toLowerCase().trim();
            bot_say = bot_say.trim();
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

            var new_persona_id = message.text.toLowerCase().trim();
            controller.storage.teams.get(new_persona_id , function(err, val) {
                if(val != null){
                    bot.replyPrivate(message, 'I already have this persona');
                }else{
                    save_id = team_id+"_"+new_persona_id
                    new_persona = {id:save_id, persona_name:'Demo Bot', persona_icon: 'http://lorempixel.com/48/48'};
                    controller.storage.teams.save(new_persona);

                    var current_persona = {id: team_id+"_"+'current_persona', data: new_persona};
                    controller.storage.teams.save(current_persona);

                    bot.replyPrivate(message, 'Created new persona - '+new_persona_id);
                }
            });

        }else if (message.command == '/load-persona'){
            var new_persona_id = message.text.toLowerCase().trim();
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
    bot.reply(message, "Hello team :wave: I am your WordsBot - give me a word and I will provide you with Definition and Synonyms. \n I support direct mentions and DMs, I will not read what is in this channel,  you will need to `@wordsbot: word-you-are-looking-for` me.")
})



controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
    bot.reply(message, ':wave:')
})









controller.hears('meta-help', ['direct_message', 'direct_mention'], function (bot, message) {
    var help = 'I will respond to the following messages: \n' +
        '`DM` me with a word.\n' +
        '`@wordsbot:` with a word.\n' +
        '`/define` with a word (this way only you see the results).\n' +
        '`bot help` to see this again.'
    bot.reply(message, help)
})



controller.hears('.*', ['direct_message', 'direct_mention', 'ambient'], function (bot, message) {
    console.log('msg - ', message);
    var team_id = message.team;
    loadPersonality(team_id, function () {
        man_say = message.text.toLowerCase().trim();
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
