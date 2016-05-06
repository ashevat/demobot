var Botkit = require('botkit')
var http = require('http')

// Expect a SLACK_TOKEN environment variable


var controller = Botkit.slackbot()
var con = require('beepboop-botkit').start(controller)
var kv = require('beepboop-persist')()
var persona = '';

//bot.startRTM(function (err, bot, payload) {
//  if (err) {
//    throw new Error('Could not connect to Slack')
//  }
//})

var morgan = require('morgan')

controller.setupWebserver(process.env.PORT,function(err,webserver) {
  controller.createWebhookEndpoints(webserver);
});

controller.on('slash_command', function (bot, message) {
  console.log('Here is the actual slash command used: ', message.command);
  var learn = message.text
  var man_say = learn.substr(0, learn.indexOf("\n")-1);
  var bot_say = learn.substr(learn.indexOf("\n")+1);
  man_say = man_say.trim();
  bot_say = bot_say.trim();
  saving  = persona+'_'+man_say;
  console.log('Saving key: ', "["+saving+"]");
  var res = kv.set(saving, bot_say, function (err) {})
  console.log("Saved key result: ["+res+"]");
  var list  = kv.list(function (err, keys) {});
  console.log('keys: ', "["+list+"]");
  bot.replyPrivate(message, 'When you say: '+man_say+' \n I will say: '+bot_say)

  //defineWord(bot, message, 2);
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
  var ds = kv.get("hello", function (err, val) {})
  bot.reply(message, 'Hello. '+ds)
  bot.reply(message, 'It\'s nice to talk to you directly. Give me a word and I will provide you with Definition and Synonyms')
})

/*
controller.hears('.*', ['mention'], function (bot, message) {
  man_say = message.text;
  var bot_say = kv.get(persona+'_'+man_say, function (err, val) {})
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
  man_say = message.text;
  loading  = persona+'_'+man_say;
  console.log('Loading key: ', "["+loading+"]");
  list  = kv.list(function (err, keys) {});
  console.log('keys: ', "["+list+"]");
  var bot_say = kv.get(loading, function (err, val) {})
  if(bot_say == undefined){
    bot.reply(message, 'what should I say? not sure... got - '+bot_say);
  }else{
    bot.reply(message, bot_say)
  }
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



function getRandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}