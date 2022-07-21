const { Client, Intents, Interaction, CommandInteractionOptionResolver } = require('discord.js')
const { token, guildId, roleId, DB } = require('./config.json')
const commands = require('./commands.js');
const fs = require('fs');
const moment = require('moment')
const mongoose = require('mongoose');
const WalletModel = require('./WalletModel');
const ethers = require('ethers');
const { google } = require('googleapis');
const googlekey = require('./key.json');


const wallet_channel = '981072291674873866';
const collab_al = '983913193506209802';
const submitted = '982957886047125574';
const allowlist = '969556846413238282';
const creators = '958740618065113168';
const OG_role = '969460645785395221';
const gladiator = '972137076336250900';
const fan_art = '969461443428753488';
const game_master = '971665868239015979';
const big_brain = '969460807630999562';
const silver = '978679979388858378';
const gold = '978680104492363816';
const bronze = '978679460515696670'
const event_channel = [
	'968785712897994762',
	'968785782502473749',
	'968785837674360832',
	'968785879105683526',
	'972401545901645895'
]
const assignable_roles = [
	gladiator,
	allowlist,
	collab_al,
	big_brain,
	OG_role,
	game_master,
	silver,
	gold,
	bronze
]


const client = new Client({ intents: [Intents.FLAGS.GUILDS, 'GUILD_MEMBERS', Intents.FLAGS.GUILD_MESSAGES], });

const google_client = new google.auth.JWT(
	googlekey.client_email,
	null,
	googlekey.private_key,
	['https://www.googleapis.com/auth/spreadsheets']
);

client.once('ready', async () => {
	console.log('Client is ready');
	await mongoose.connect(DB, {
		useNewUrlParser: true,
	}).then(() => {
		console.log("DB connected");
	}).catch(err => {
		console.log(err);
		process.exit(1);
	})

	await commands();
});

client.on('interactionCreate', async interaction => {

	const guild = client.guilds.cache.find(g => g.id === guildId);
	if (!guild) {
		interaction.reply('Not found');
		return;
	}
	const { commandName } = interaction;
	if (commandName == 'wallet') {
		if (interaction.channelId != wallet_channel) {
			await interaction.reply({ content: 'This command is not allowed in this channel', ephemeral: true });
			return;
		}
		const wallet_address = interaction.options.get('wallet_address').value;
		if (!ethers.utils.isAddress(wallet_address)) {
			await interaction.reply({ content: 'Wrong ETH address format', ephemeral: true });
			return;
		}

		const existing = await WalletModel.findOne({ user_id: interaction.user.id }).exec();
		if (existing) {
			const updated = await WalletModel.updateOne(
				{
					$or: [
						{user_id: interaction.user.id },
						{name: interaction.user.username}
					]
				},
				{
					user_id: interaction.user.id,
					name: interaction.user.username,
					discri: interaction.user.discriminator,
					role: interaction.member.roles.cache.map(r => r.id),
					last_updated: moment(),
					wallet: wallet_address,
				}
			)
			if (updated.modifiedCount > 0) await interaction.reply({ content: `Wallet updated to \`${wallet_address}\``, ephemeral: true });
			else await interaction.reply({ content: `Wallet failed to update`, ephemeral: true });
			return;
		} else {
			const created = await WalletModel.create({
				user_id: interaction.user.id,
				name: interaction.user.username,
				discri: interaction.user.discriminator,
				role: interaction.member.roles.cache.map(r => r.id),
				last_updated: moment(),
				wallet: wallet_address,
			})

			await interaction.member.roles.add('982957886047125574');

			if (created) await interaction.reply({ content: `Wallet \`${wallet_address}\` successfully submitted`, ephemeral: true });
			else await interaction.reply({ content: `Wallet failed to submit`, ephemeral: true });
			return;
		}

	} else if (commandName == 'walletcheck') {
		if (interaction.channelId != wallet_channel) {
			await interaction.reply({ content: 'This command is not allowed in this channel', ephemeral: true });
			return;
		}
		const existing = await WalletModel.findOne({ user_id: interaction.user.id }).exec();
		if (existing) {
			await interaction.reply({ content: `Submitted wallet \`${existing.wallet}\` at <t:${moment(existing.last_updated).unix()}>`, ephemeral: true });
			return;
		} else {
			await interaction.reply({ content: `No record of wallet submission`, ephemeral: true });
			return;
		}
	} else if (commandName == 'exportwallet') {
		if (interaction.channelId != '907205846059089951') {
			await interaction.reply({ content: 'This command is not allowed in this channel', ephemeral: true });
			return;
		}

		const all_members = await guild.members.fetch();
		const guild_members = all_members.map(member => member);

		await google_client.authorize(async function (err, token) {
			if (err) {
				console.log('Google api failed');
				await interaction.channel.reply({ content: 'Google api failed' });
				return;
			}

			await interaction.channel.send({ content: 'Google api connected' });
			if (export_wallet(google_client, guild_members)) await interaction.reply({ content: 'Successfully exported' });
			else await interaction.reply({ content: 'Failed to export' });
		})
	} else if (commandName == 'cal') {
		if (interaction.channelId != '972401545901645895') {
			await interaction.reply({ content: 'This command is not allowed in this channel', ephemeral: true });
			return;
		}

		const all_members = await guild.members.fetch();
		const members_list = all_members.map(member => member);

		const err = await google_client.authorize();
		if (!err) {
			console.log('Google api failed');
			await interaction.channel.send({ content: 'Google api failed' });
			return;
		}

		const sheets = await read_sheets(google_client);
		if (sheets) await interaction.channel.send({ content: 'Successfully read' });
		else await interaction.channel.send({ content: 'Failed to read' });

		let count = 0;
		for (index in sheets) {
			count++;
			const row = sheets[index];

			if (row.length < 1) continue;
			if (row[0].length > 0 && row[0] != 'null') {
				const name_array = row[0].split('#');
				const found = members_list.find(member => member.user.username == name_array[0] && member.user.discriminator == name_array[1]);
				if (found) {
					if (row[0].length > 0 && (!row[1] || row[1].length < 1)) {
						console.log(`${index} ` + found.user.username);
						const tmp = found.roles.cache.map(r => r.id);
						if (tmp.includes(allowlist)) await found.roles.remove(allowlist);
						await found.roles.add(collab_al);
					} else if (row[0].length > 0 && row[1].length > 1) {
						console.log(`${index} ` + found.user.username);
						try {
							const tmp = found.roles.cache.map(r => r.id);
							if (tmp.includes(allowlist)) await found.roles.remove(allowlist);
							await found.roles.add(collab_al);
							const created = await WalletModel.updateOne(
								{
									$or: [
										{user_id: found.user.id},
										{name: found.user.username}
									]
								},
								{
									name: found.user.username,
									discri: found.user.discriminator,
									role: found.roles.cache.map(r => r.id),
									last_updated: moment(),
									wallet: row[1],
								},
								{ upsert: true }
							)
							if (created) await found.roles.add([collab_al, submitted]);
						} catch (e) {
							console.log(e);
							console.log(`${found.user.username}#${found.user.discriminator} failed to add`)
						}
					}
				} else {
					if (name_array.length < 2) continue;
					try {
						console.log(`${index} ` + name_array[0]);
						const created = await WalletModel.updateOne(
							{
								name: name_array[0],
								discri: name_array[1]
							},
							{
								name: name_array[0],
								discri: name_array[1] ?? '',
								role: [collab_al],
								last_updated: moment(),
								wallet: row[1] ?? '',
							},
							{ upsert: true }
						)
					} catch (e) {
						console.log(`${name_array[0]}#${name_array[1]} not in discord and failed to add wallet`);
					}
				}
			} else if ((row[0].length < 1 || row[0] == 'null') && row[1].length > 0) {
				console.log(row[1]);
				try {
					const created = await WalletModel.updateOne(
						{ wallet: row[1] },
						{
							last_updated: moment(),
							wallet: row[1],
						},
						{ upsert: true }
					)
				} catch (e) {
					console.log(e);
				}
			}
		}
		// console.log(sheets);
	} else if (commandName == 'sync') {
		if (interaction.channelId != '972401545901645895') {
			await interaction.reply({ content: 'This command is not allowed in this channel', ephemeral: true });
			return;
		}

		const all_members = await guild.members.fetch();
		const members_list = all_members.map(member => member);
		const db = await WalletModel.find({
			$or: [
				{
					user_id: { $exists: true },
					$expr: {
						$gt: [{ $strLenCP: '$user_id' }, 1]
					}
				},
				{
					name: { $exists: true },
					$expr: {
						$gt: [{ $strLenCP: '$name' }, 1]
					}
				}
			]
		}).exec();

		for (index in db) {
			const member = members_list.find(member => member.user.id == db[index].user_id || member.user.username == db[index].name);
			if (!member) continue;
			console.log(`${index} ` + member.user.username);
			const updated = await WalletModel.updateOne(
				{
					$or: [
						{user_id: member.user.id},
						{name: member.user.username},
					]
				},
				{
					role: member.roles.cache.map(r => r.id),
					user_id: member.user.id,
				}
			)
		}
	} else if (commandName == 'event') {
		if (!event_channel.includes(interaction.channelId)) {
			await interaction.reply({ content: 'This command is not allowed in this channel', ephemeral: true });
			return;
		}
		if (!interaction.member.roles.cache.some(r => r.id === '953301503404290138')) {
			await interaction.reply({ content: 'You are not allowed to use this command', ephemeral: true });
			return;
		};

		const event_role = '968773347401949224';
		await interaction.reply({ content: 'Pinged', ephemeral: true });
		await interaction.channel.send({ content: `<@&${event_role}>` });

	} else if (commandName == 'role') {
		if (!interaction.member.roles.cache.some(r => r.id === '953301503404290138')) {
			await interaction.reply({ content: 'You are not allowed to use this command', ephemeral: true });
			return;
		};

		if (!assignable_roles.includes(interaction.options.get('role').role.id)) {
			await interaction.reply({ content: 'You are not allowed to assign that role', ephemeral: true });
			return;
		}

		// console.log(interaction.member.roles);
		try {
			const assigned = await interaction.options.get('user').member.roles.add(interaction.options.get('role').role.id);
			if (assigned) await interaction.reply({ content: 'Assigned !', ephemeral: true });
		} catch (e) {
			console.log(e.message);
			if (e.message == 'Missing Permissions') await interaction.reply({ content: 'You are not allowed to assign this role !', ephemeral: true })
		}
	} else if (commandName == 'rrole') {
		if (!interaction.member.roles.cache.some(r => r.id === '953301503404290138')) {
			await interaction.reply({ content: 'You are not allowed to use this command', ephemeral: true });
			return;
		};

		if (!interaction.options.get('user').member.roles.cache.some(r => r.id == interaction.options.get('role').role.id)) {
			await interaction.reply({ content: 'User doesn\'t have this role', ephemeral: true });
			return;
		}

		try {
			const assigned = await interaction.options.get('user').member.roles.remove(interaction.options.get('role').role.id);
			if (assigned) await interaction.reply({ content: 'Removed !', ephemeral: true });
		} catch (e) {
			console.log(e.message);
			if (e.message == 'Missing Permissions') await interaction.reply({ content: 'You are not allowed to remove this role !', ephemeral: true })
		}
	}

})


client.login(token);

async function read_sheets(cl) {
	const gsapi = google.sheets({ version: 'v4', auth: cl });
	const exported = await gsapi.spreadsheets.values.get({
		spreadsheetId: '1lzKSkFJAa_nNOvfwDBhZdjqv46l2Ig0K-MXxgjPJC1s',
		range: 'From GiveAways!A4434:B4802',
		majorDimension: 'ROWS',
	});

	const values = exported.data.values;
	return values;
}

const heirachy_one = (wallet) => {
	const wallet_roles = wallet.role;
	return wallet_roles.includes(creators);
}

const heirachy_two = (wallet) => {
	const wallet_roles = wallet.role;
	return !wallet_roles.includes(creators) && wallet_roles.includes(allowlist);
}

const heirachy_three = (wallet) => {
	const wallet_roles = wallet.role;
	return !wallet_roles.includes(creators) && !wallet_roles.includes(allowlist) && wallet_roles.includes(OG_role);
}

const heirachy_four = (wallet) => {
	const wallet_roles = wallet.role;
	return !wallet_roles.includes(creators) && !wallet_roles.includes(allowlist) && !wallet_roles.includes(OG_role) && (wallet_roles.includes(collab_al) || wallet.name.length < 1);
}

const heirachy_five = (wallet) => {
	const wallet_roles = wallet.role;
	return !wallet_roles.includes(creators) && !wallet_roles.includes(allowlist) && !wallet_roles.includes(OG_role) && !wallet_roles.includes(collab_al) && helper_heirachy_five(wallet);
}

const heirachy_six = (wallet) => {
	const wallet_roles = wallet.role;
	return !wallet_roles.includes(creators) && !wallet_roles.includes(allowlist) && !wallet_roles.includes(OG_role) && !wallet_roles.includes(collab_al) && !helper_heirachy_five(wallet);
}

const helper_heirachy_five = (wallet) => {
	const wallet_roles = wallet.role;
	return wallet_roles.includes(gladiator) || wallet_roles.includes(fan_art) || wallet_roles.includes(big_brain) || wallet_roles.includes(game_master);
}

async function export_wallet(cl, guid_members) {

	const wallets = await WalletModel.find().select('user_id name discri wallet role').exec();

	const in_discord = await WalletModel.find(
		{
			user_id: { $exists: true },
			$expr: {
				$gt: [{ $strLenCP: '$user_id' }, 1]
			}
		}
	).select('user_id').exec();

	let existed = 0;
	if (in_discord.length > 0) {
		for (in_index in in_discord) {
			if (guid_members.find(member => member.user.id == in_discord[in_index].user_id))
				existed++;
		}
	}

	let h_one = 0;
	let h_two = 0;
	let h_three = 0;
	let h_four = 0;
	let h_five = 0;
	let h_six = 0;

	const heirachy_functions = [
		[ heirachy_one, h_one, 'Creators' ],
		[ heirachy_two, h_two, 'Allowlist' ],
		[ heirachy_three, h_three, 'OGs' ],
		[ heirachy_four, h_four, 'Collab AL' ],
		[ heirachy_five, h_five, 'Fan art, Game master, Gladiator, Big brain' ],
		[ heirachy_six,  h_six, 'Roles not assigned'],
	];

	var wallet_arr = [];
	if (wallets.length > 0) {
		for (f_num in heirachy_functions) {
			wallet_arr.push(['', '']);
			wallet_arr.push([`${heirachy_functions[f_num][2]}`, '']);
			for (index in wallets) {
				const wallet_single = wallets[index];
				if (heirachy_functions[f_num][0](wallet_single)) {
					heirachy_functions[f_num][1]++;
					if (wallets[index].name.length > 0) wallet_arr.push([`${wallets[index].name}#${wallets[index].discri}`, wallets[index].wallet]);
					else wallet_arr.push(['', wallets[index].wallet]);
				}
			}
		}
	}

	wallet_arr.push(['Creators', heirachy_functions[0][1]]);
	wallet_arr.push(['Allowlist', heirachy_functions[1][1]]);
	wallet_arr.push(['OGs', heirachy_functions[2][1]]);
	wallet_arr.push(['Collab AL', heirachy_functions[3][1]]);
	wallet_arr.push(['Fan art, Game master, Gladiator, Big brain', heirachy_functions[4][1]]);
	wallet_arr.push(['Roles not assigned', heirachy_functions[5][1]]);
	wallet_arr.push(['Existed in Discord', existed]);

	const gsapi = google.sheets({ version: 'v4', auth: cl });
	try {
		const exported = await gsapi.spreadsheets.values.update({
			spreadsheetId: '1xSqGgmKguQXx29A136KKANBYrDXgHtO8ZNhnITNYXh0',
			range: 'Sheet1',
			valueInputOption: 'USER_ENTERED',
			resource: { values: wallet_arr },
		});
	}
	catch(e){
		console.log(e);
	}
	

	if (exported.status == 200) return true;
	else return false;
}


