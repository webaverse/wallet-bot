const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9')
const { guildId, clientId, token } = require('./config.json');

module.exports = async () => {
	const commands = [
		new SlashCommandBuilder().setName('wallet')
								.setDescription('Submit wallet address for allowlist mint')
								.addStringOption(option => option.setName('wallet_address')
																.setDescription('Wallet address which you are using it to mint')
																.setRequired(true)
												),
		new SlashCommandBuilder().setName('walletcheck').setDescription('Check wallet submission'),
		new SlashCommandBuilder().setName('exportwallet').setDescription('Export Wallets to Googlesheet'),
		new SlashCommandBuilder().setName('event').setDescription('Ping Event'),
		new SlashCommandBuilder().setName('role')
								.setDescription('Assign role')
								.addUserOption(option => option.setName('user')
															.setDescription('User to be added the role')
															.setRequired(true)
								)
								.addRoleOption(option => option.setName('role')
															.setDescription('Role to be added for the user')
															.setRequired(true)
								),
		new SlashCommandBuilder().setName('rrole')
								.setDescription('Remove role')
								.addUserOption(option => option.setName('user')
															.setDescription('User to be added the role')
															.setRequired(true)
								)
								.addRoleOption(option => option.setName('role')
															.setDescription('Role to be added for the user')
															.setRequired(true)
								),
		new SlashCommandBuilder().setName('cal').setDescription('.....'),
		// new SlashCommandBuilder().setName('sync').setDescription('.....'),
	].map(command => command.toJSON());

	const rest = new REST({ version: '9' }).setToken(token);

	await rest.put(Routes.applicationCommands(clientId), { body: commands })
			.then(() => console.log('Successfully registered application commands.'))
			.catch(console.error);
}
