const { REST, Routes } = require('discord.js');
const { CurrentDate }  = require("./util.js");
const fs = require('node:fs');
const path = require('node:path');
class CommandDeploy {
  #commands = [];

  constructor() {
    const commands = [];
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const command = require(`./commands/${file}`);
      commands.push(command.data.toJSON());
    }
    this.#commands = commands;
  }

  #rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  async globalDeploy(clear = false) {
    const commands = clear ? [] : this.#commands;
    try {
      console.log(CurrentDate()+`Started refreshing ${commands.length} global application (/) commands.`);

      const data = await this.#rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );

      console.log(CurrentDate()+`Successfully reloaded ${data.length} global application (/) commands.`);
    } catch (error) {
      console.error(error);
    }
  }
  async serverDeploy(clear = false) {
    const commands = clear ? [] : this.#commands;
    try {
      console.log(CurrentDate()+`Started refreshing ${commands.length} server application (/) commands.`);
  
      // The put method is used to fully refresh all commands in the guild with the current set
      const data = await this.#rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.SERVER_ID),
        { body: commands },
      );
  
      console.log(CurrentDate()+`Successfully reloaded ${data.length} server application (/) commands.`);
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  }
}
module.exports = CommandDeploy;