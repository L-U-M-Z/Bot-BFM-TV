const { Client } = require("discord.js");
const dotenv = require("dotenv");
const APIs = require("apis");

const {
    getVoiceConnection,
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    entersState,
    VoiceConnectionStatus,
    NoSubscriberBehavior,
} = require("@discordjs/voice");


/////////////////////////////////////////
//  DOTENV
/////////////////////////////////////////


// Load .env file.
dotenv.config();


/////////////////////////////////////////
//  GLOBAL
/////////////////////////////////////////


const player = createAudioPlayer({
    behaviors: {
        noSubscriber    : NoSubscriberBehavior.Play,
        maxMissedFrames : Math.round(5000 / 20),
    }
});

const client = new Client({
    intents: [
        "GUILDS",
        "GUILD_VOICE_STATES",
        "GUILD_MESSAGES"
    ]
});

// Start music.
APIs.fetch(`GET`, `https://chai5she.cdn.dvmr.fr/bfmtv`, { stream: true }).then(stream => {
    player.play(createAudioResource(stream));
});


/////////////////////////////////////////
//  MUSIC
/////////////////////////////////////////


async function joinChannel(voiceChannel) {
    let connection = joinVoiceChannel({
        channelId       : voiceChannel.id,
        guildId         : voiceChannel.guild.id,
        adapterCreator  : voiceChannel.guild.voiceAdapterCreator,
        selfDeaf        : false,
        selfMute        : false
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30000);

        // Subscribe player.
        connection.subscribe(player);

        return connection;

    } catch (err) {
        connection.destroy();
        throw (err);
    }
}


/////////////////////////////////////////
//  EVENTS
/////////////////////////////////////////


client.on('ready', function () {
    console.log(`${client.user.tag} ready !`);

    // Set presence.
    client.user.setPresence({
        activity: {
            type    : "LISTENING",
            name    : "BFMTV",
        }
    });
});

client.on('messageCreate', function (message) {
    switch (message.content) {
        case "bfmtv join":
            // Delete message.
            message.delete().catch(console.error);

            // Join channel.
            joinChannel(message.member.voice.channel);
            break;

        case "bfmtv quit":
            // Delete message.
            message.delete().catch(console.error);

            // Leave channel.
            getVoiceConnection(message.guild.id).destroy();
            break;
    }
});


/////////////////////////////////////////
//  MAIN
/////////////////////////////////////////


client.login(process.env.DISCORD_BOT_TOKEN);
