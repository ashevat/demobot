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
    return key.toLowerCase().replace(/\./g, "").replace(/\?/g,"").replace(/\$/g,"").replace(/\//g,"").replace(/\[/g,"").replace(/\]/g,"").replace(/\#/g,"").trim();
}

controller.on('slash_command', function (bot, message) {
    console.log('Here is the actual slash command used: ', message.command);
    var team_id  = message.team_id;
    var channel = message.channel;
    loadPersonality(team_id, message.channel, function () {

        if(message.command == '/learn'){
            var learn = message.text
            var man_say = learn.substr(0, learn.indexOf("\n")-1);
            var bot_say = learn.substr(learn.indexOf("\n")+1);
            var orig_man_say = man_say;
            man_say = cleanKey(man_say);
            bot_say = bot_say.trim();
            if(man_say == "" || bot_say == ""){
                bot.replyPrivate(message, 'missing param - you say is ('+orig_man_say+') I say is ('+bot_say+') - please use `/learn [you say] \\n [bot say]` to teach the bot new tricks (Use shift+enter for new lines)');
                return;
            }

            if(man_say == "import"){
                // handle import
                learnings  = JSON.parse(bot_say);
                var count = 0;
                for (var key in learnings) {
                    if (learnings.hasOwnProperty(key)) {
                        learning = learnings[key];
                        learning['id'] = persona.id+'_voc/'+key;
                        controller.storage.teams.save(learning);
                        count++;
                    }
                }
                bot.replyPrivate(message, 'Imported '+count+' items')

            }else {
                var  attachments = null;

                bot_say = bot_say+""; //'{ "text": "I am a test message http://slack.com", "attachments": [ { "text": "And here’s an attachment!"} ]}';
                console.log('string ='+ bot_say);

                if(bot_say.indexOf('attachments')>0){
                    //console.log('match value "attachments'+ bot_say.indexOf('"attachments'));
                    //try {
                    p_data = JSON.parse(bot_say);
                    //} catch(err) {
                    //    bot.replyPrivate(message, 'Could not digest your JSON. Please test at https://api.slack.com/docs/messages/builder');
                    //    return;
                    //}
                    attachments = p_data["attachments"];
                    if(p_data["text"]!=null && p_data["text"]!=''){
                        bot_say =  p_data["text"];
                    }else{
                        bot_say  = "";
                    }
                }else{
                    console.log('{'+bot_say+'} did NOT match value "attachments -'+ bot_say.indexOf('attachments')+ 'but '+bot_say.includes('dd'));
                }
                saving  = persona.id+'_voc/_'+man_say;
                console.log('Saving key, value: ', "["+saving+"],["+bot_say+"}", attachments );
                if(attachments != null){
                    var learning = {id: saving, humansay: orig_man_say, botsay: bot_say, attachments: attachments};
                    controller.storage.teams.save(learning);
                    bot.replyPrivate(message, 'When you say: '+orig_man_say+' \n I will say: '+p_data)
                }else{
                    var learning = {id: saving,  humansay: orig_man_say, botsay: bot_say};
                    controller.storage.teams.save(learning);
                    bot.replyPrivate(message, 'When you say: '+orig_man_say+' \n I will say: '+bot_say)
                }
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

            // check if pinned persona
            controller.storage.teams.get(team_id+"_pin_/"+channel, function(err, val) {
                var pinned_persona_id = null;
                var persona_id = null;
                if (val != null && val.value != undefined) {
                    pinned_persona_id = val.value;
                    //We have a pinned persona
                    controller.storage.teams.get(team_id+"_"+'current_persona', function(err, val) {
                        if(val != null){
                            persona = val.data
                            persona_id = val.data.id;
                            if(persona_id == pinned_persona_id){
                                val.data.persona_name = new_persona_name;
                                controller.storage.teams.save(val);
                            }else{
                                persona_id = pinned_persona_id;
                            }
                            controller.storage.teams.get(persona_id, function(err, val1) {
                                if(val1 != null){
                                    val1.persona_name = new_persona_name;
                                    controller.storage.teams.save(val1);
                                    bot.replyPrivate(message, 'From now on I shall be called Dr. '+new_persona_name);

                                }
                            });
                        }
                    });

                }else{
                    // no pinned persona
                    controller.storage.teams.get(team_id+"_"+'current_persona', function(err, val) {
                        if(val != null){
                            persona = val.data
                            persona_id = val.data.id;
                            val.data.persona_name = new_persona_name;
                            controller.storage.teams.save(val);
                            controller.storage.teams.get(persona_id, function(err, val1) {
                                if(val1 != null){
                                    val1.persona_name = new_persona_name;
                                    controller.storage.teams.save(val1);
                                    bot.replyPrivate(message, 'From now on I shall be called Dr. '+new_persona_name);

                                }
                            });
                        }
                    });

                }

            })



        }else if (message.command == '/list-personas'){
            controller.storage.teams.get(team_id+"_personas", function(err, val) {
                if(val != null){
                    bot.replyPrivate(message, 'Personas -  '+ val.data);
                }else{
                    bot.replyPrivate(message, 'No Personas');
                }
            });

        }else if (message.command == '/export-persona'){


            bot.replyPrivate(message, 'coming soon!');
        }else if (message.command == '/set-persona-icon-url'){
            var new_persona_icon_url = message.text.trim();
            // check if pinned persona
            controller.storage.teams.get(team_id+"_pin_/"+channel, function(err, val) {
                var pinned_persona_id = null;
                var persona_id = null;
                if (val != null && val.value != undefined) {
                    pinned_persona_id = val.value;
                    // we have a pinned persona
                    controller.storage.teams.get(team_id+"_"+'current_persona', function(err, val) {
                        if(val != null){
                            persona = val.data
                            persona_id = val.data.id;
                            if(persona_id == pinned_persona_id){
                                val.data.persona_icon = new_persona_icon_url;
                                controller.storage.teams.save(val);
                            }else{
                                persona_id = pinned_persona_id;
                            }
                            console.log('persona_in VAL -',persona_id );
                            console.log('pinned persona_in VAL -',pinned_persona_id );
                            controller.storage.teams.get(persona_id, function(err, val1) {
                                if(val1 != null){
                                    val1.persona_icon = new_persona_icon_url;
                                    controller.storage.teams.save(val1);
                                    bot.replyPrivate(message, 'From now on I shall use a new icon - '+new_persona_icon_url);

                                }
                            });
                        }
                    });
                }else{
                    // no pinned persona
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
                }
            })



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

            controller.storage.teams.get(team_id+"_"+'current_persona', function(err, val) {
                if(val != null){
                    var persona_id = val.data.id
                    console.log('Saving persona, channel: ', "["+persona+"],["+channel+"]" );
                    save_id = team_id+"_pin_/"+channel;
                    pin_persona = {id:save_id, value:persona_id};
                    controller.storage.teams.save(pin_persona);
                    bot.replyPrivate(message, 'Saving persona: '+persona_id+', channel: '+channel );

                }else{
                    bot.replyPrivate(message, 'Cloud not pin empty persona' );
                }
            })

    }else if (message.command == '/unpin-persona'){
            save_id = team_id+"_pin_/"+channel;
            pin_persona = {id:save_id, value:null};
            controller.storage.teams.save(pin_persona);
            bot.replyPrivate(message, 'Unpinned '+channel );


    }else{
        bot.replyPublic(message, "");

    }
    });


});

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, ":wave: team -  I am your demo bot. \n I support direct mentions and DMs, I will read what is in this channel and try to respond accordingly -  you can also `@demobot: help` me.")
})



controller.hears('interactive', 'direct_message', function(bot, message) {

    bot.reply(message, {
        attachments:[
            {
                title: 'Do you want to interact with my buttons?',
                callback_id: '123',
                attachment_type: 'default',
                actions: [
                    {
                        "name":"yes",
                        "text": "Yes",
                        "value": "yes",
                        "type": "button",
                    },
                    {
                        "name":"no",
                        "text": "No",
                        "value": "no",
                        "type": "button",
                    }
                ]
            }
        ]
    });
});

// receive an interactive message, and reply with a message that will replace the original
controller.on('interactive_message_callback', function(bot, message) {

    // check message.actions and message.callback_id to see what action to take...
    console.log("got actions" , message.actions);
    var team_id = message.team["id"];
    console.log("got team" , team_id);

    loadPersonality(team_id, message.channel, function () {
        man_say = cleanKey(message.text);
        loading  = persona.id+'_voc/_clicked_'+message.callback_id+"_"+message.actions[0]["value"];
        console.log('Loading key: ', "["+loading+"]");

        controller.storage.teams.get(loading, function(err, val) {
            console.log("got value" , val)
            if(val == undefined){
                console.log('what should I say when you say "'+man_say+'"');
                if(message.event != "ambient"){
                    bot.replyInteractive(message, compose('what should I say when you say "'+man_say+'"? not sure... \n Please use `/learn clicked_'+message.callback_id+"_"+message.actions[0]["value"]+'` to teach me new tricks!', [] ));
                }
            }else{
                resp = val["botsay"].toString();
                var attach = val["attachments"];
                if(attach == undefined || attach == null){
                    attach = []
                }
                bot.replyInteractive(message, compose(resp, attach) )
            }
        });

    });

    //bot.replyInteractive(message, "got message id"+message.callback_id+" and actions "+message.actions);


});


controller.hears(['^hello$'], ['direct_message', 'direct_mention', "ambient"], function (bot, message) {
    loadPersonality(message.team, message.channel, function () {
        bot.reply(message, compose( ":wave: I am "+persona.persona_name))
    })

})


controller.hears(['^help$'], ['direct_message', 'direct_mention'], function (bot, message) {
    bot.reply(message, helpText)
})

controller.hears(['^export yourself$'], ['direct_message', 'direct_mention'], function (bot, message) {
    var team_id = message.team;
    loadPersonality(team_id, message.channel, function () {
        loading  = persona.id+'_voc/';
        console.log('Loading vocabulary: ');

        controller.storage.teams.get(loading, function(err, val) {
            console.log("got value" , val)
            call_config = { filename: "persona_export_"+persona.persona_name+".txt" , content: JSON.stringify(val), filetype: 'text', channels: message.channel}
            bot.api.files.upload(call_config, function(err,res) {

                if (err) {
                    bot.reply(message, 'can not export!');
                    console.log(err, bot)
                    return;
                }
            });

        });

    });

})


controller.hears('.*', ['direct_message', 'direct_mention', 'ambient'], function (bot, message) {
    //console.log('msg - ', message);
    var team_id = message.team;
    loadPersonality(team_id, message.channel, function () {
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

function loadPersonality(team_id, channel, callback) {
    console.log('try to loadPersonality: '+team_id+"_pin_/"+channel);
    controller.storage.teams.get(team_id+"_pin_/"+channel, function(err, val) {
        if(val != null && val.value != undefined){
            persona_id  = val.value
            console.log('Pinned persona', val.value);
            controller.storage.teams.get(persona_id, function(err, value) {
                if(value != null){
                    persona = value
                    console.log('Pinned calling callback', value);
                    callback();
                }else{
                    console.log('Pinned persona load fail');
                }
            })

        }else{
            console.log('loadPersonality current');
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

    })

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
    '* :new: Use `/pin-personas` to pin the current persona to a channel\n'+
    '* :new: Use `/unpin-persona` to unpin a persona in a channel (defaults back to current)\n'+
    '* :new: Say `hello` to the bot to get the bot name\n'+
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

