import { Client, Intents } from 'discord.js'
import { fetch } from 'medusa';


/////////////////////////////////////////
//  GLOBAL
/////////////////////////////////////////


const client    = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES ] });
const broadcast = client.voice.createBroadcast();

//  UTILS

async function joinLiveStage(guild) {
    let connection;

    for (let [id, channel] of guild.channels.cache) {
        if (channel.type == 'stage' && channel.name == "BFM TV") {
            console.log(`Joining ${id}.`);

            // Set stage topic.
            await channel.setTopic('Live Radio').catch(console.error);

            // Join channel.
            connection = await channel.join();
            connection.voice.setSuppressed(false);
            connection.play(broadcast);
            return;
        }
    }
}


/////////////////////////////////////////
//  EVENTS
/////////////////////////////////////////


client.on('ready', function () {
    console.log(`${client.user.tag} ready !`);

    //  PRESENCE

    client.user.setPresence({
        activity: {
            name    : 'Live Radio',
            type    : 'WATCHING'
        }
    });

    //  AUTO JOIN

    for (let [_, guild] of client.guilds.cache)
        joinLiveStage(guild).catch(console.error);
});

client.on('message', function (message) {
    if (message.content == '/bfmtv join') {
        message.delete().catch(console.error);
        joinLiveStage(message.guild).catch(console.error);
    }

    if (message.content == '/bfmtv quit') {
        message.delete().catch(console.error);

        let me = message.guild.me;

        if (me.voice) {
            me.voice.connection.disconnect();
            me.voice.channel.setTopic('').catch(console.error);
        }
    }
});

client.on('voiceStateUpdate', function (oldState, newState) {
    if (oldState.requestToSpeakTimestamp == null && newState.requestToSpeakTimestamp) {
        newState.setSuppressed(false);
    }
});


/////////////////////////////////////////
//  MAIN
/////////////////////////////////////////


fetch('GET', 'https://chai5she.cdn.dvmr.fr/bfmtv', { stream: true }).then(stream => {
    broadcast.play(stream);
});

client.login('YOUR_TOKEN');
