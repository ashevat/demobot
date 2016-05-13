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

var persona = {id:"default", persona_name:'Demo Bot', persona_icon: 'http://lorempixel.com/48/48'};


var morgan = require('morgan')

controller.setupWebserver(process.env.PORT,function(err,webserver) {
  controller.createWebhookEndpoints(webserver);
});

controller.on('slash_command', function (bot, message) {
  console.log('Here is the actual slash command used: ', message.command);
  if(message.command == '/learn'){
    var learn = message.text
    var man_say = learn.substr(0, learn.indexOf("\n")-1);
    var bot_say = learn.substr(learn.indexOf("\n")+1);
    man_say = man_say.toLowerCase().trim();
    bot_say = bot_say.trim();
    saving  = persona.id+'_voc_'+man_say;
    console.log('Saving key, value: ', "["+saving+"],["+bot_say+"}");

    var learning = {id: saving, botsay: bot_say};

    controller.storage.teams.save(learning);
    bot.replyPrivate(message, 'When you say: '+man_say+' \n I will say: '+bot_say)

  }else if(message.command == '/new-persona'){

    var new_persona_id = message.text.toLowerCase().trim();
    controller.storage.teams.get(new_persona_id , function(err, val) {
      if(val != null){
        bot.replyPrivate(message, 'I already have this persona');
      }else{
        new_persona = {id:new_persona_id, persona_name:'Demo Bot', persona_icon: 'http://lorempixel.com/48/48'};
        controller.storage.teams.save(new_persona);

        var current_persona = {id: 'current_persona', data: new_persona};
        controller.storage.teams.save(current_persona);

        bot.replyPrivate(message, 'Created new persona - '+new_persona.id);
      }
    });

  }else if (message.command == '/load-persona'){
    var new_persona_id = message.text.toLowerCase().trim();
    controller.storage.teams.get(new_persona_id , function(err, val) {
      if(val != null){
        //console.log('loaded value, new_persona_id -', val, new_persona_id);
        var current_persona = {id: 'current_persona', data: val};
        controller.storage.teams.save(current_persona);

        bot.replyPrivate(message, 'Loaded new persona - '+val.id);
      }else{

        // persona not found
        bot.replyPrivate(message, 'I need my meds! could not find - '+new_persona_id);
      }
    });

  }else if (message.command == '/set-persona-name'){
    var new_persona_name = message.text.trim();
    controller.storage.teams.get('current_persona', function(err, val) {
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
    controller.storage.teams.get('current_persona', function(err, val) {
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

  }else{
    var human_say = message.command +" "+message.text.toLowerCase().trim();
    console.log('gonig to call' ,  message);
    bot.replyPublic(message, "");
  }

});


con.on('add_resource', function (message) {
  var slackTeamId = message.resource.SlackTeamID
  var slackUserId = message.resource.SlackUserID
  console.log('Got to A! add_resource', slackTeamId, slackUserId, message)

  if (message.isNew && slackUserId) {
    console.log('Got to B ', slackUserId);
    var bot = con.botByTeamId(slackTeamId)
    if (!bot) {
      return console.log('Error looking up botkit bot for team %s', slackTeamId)
    }

    console.log('starting private conversation with ', slackUserId)
    //bot.api.im.open({user: slackUserId}, function (err, response) {
    // if (err) return console.log(err)
    // var dmChannel = response.channel.id
    // bot.say({channel: dmChannel, text: 'I am the most glorious bot to join your team'})
    // bot.say({channel: dmChannel, text: 'You must now /invite me to a channel so that I may show everyone how dumb you are'})
    //})
    bot.startPrivateConversation({user: slackUserId},function(err,convo) {
      if (err) {
        console.log(err);
      } else {
        convo.say(':wave: I am the Words bot that has just joined your team');
        convo.say('You can now /invite me to a channel so that I can be of use to the team or DM/@wordsbot me anytime!');
      }
    });


  }else{
    console.log('Did not go to B ', slackUserId);
  }
})

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "Hello team :wave: I am your WordsBot - give me a word and I will provide you with Definition and Synonyms. \n I support direct mentions and DMs, I will not read what is in this channel,  you will need to `@wordsbot: word-you-are-looking-for` me.")
})

controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
  bot.reply(message, ':wave:')
})

controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
  //var ds = kv.get("hello", function (err, val) {})
  bot.reply(message, 'Hello. ')
  bot.reply(message, 'It\'s nice to talk to you directly. Give me a word and I will provide you with Definition and Synonyms')
})

/*
 controller.hears('.*', ['mention'], function (bot, message) {
 man_say = message.text;
 if(bot_say == undefined){
 bot.reply(message, 'what should I say?')
 }else{
 bot.reply(message, bot_say)
 }

 })*/


controller.hears('meta-help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`DM` me with a word.\n' +
      '`@wordsbot:` with a word.\n' +
      '`/define` with a word (this way only you see the results).\n' +
      '`bot help` to see this again.'
  bot.reply(message, help)
})




controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  loadPersonality( function () {
    man_say = message.text.toLowerCase().trim();
    loading  = persona.id+'/voc/'+man_say;
    console.log('Loading key: ', "["+loading+"]");

    controller.storage.teams.get(loading, function(err, val) {
      console.log("got value" , val)
      if(val == undefined){
        bot.reply(message, 'what should I say here? not sure... \n Please use /learn to teach me new tricks!');
      }else{
        resp = val["botsay"].toString();
        bot.reply(message, compose(resp, []) )
      }
    });

  });


})


controller.on('create_bot',function(bot,config) {


  bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
    if (err) {
      console.log(err);
    } else {
      convo.say('I am a bot that has just joined your team');
      convo.say('You must now /invite me to a channel so that I can be of use!');
    }
  });

});


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

function loadPersonality(callback) {
  console.log('loadPersonality ');
  controller.storage.teams.get('current_persona', function(err, val) {
    if(val != null){
      persona = val.data
      console.log('calling callback', val.data);
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