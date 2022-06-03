// ==UserScript==
// @name         Shellfish PFPs
// @namespace    https://cst1229.github.io/
// @version      0.9
// @description  Shows IRCCloud PFPs and allows setting a PFP in shellfish (Kiwi IRC). To set your PFP, set shellfishpfps.pfp in the advanced settings to an image URL. In beta, stuff might break.
// @author       CST1229
// @match        https://web.libera.chat/*
// @match        https://kiwiirc.com/nextclient/*
// @icon         https://kiwiirc.com/favicon.ico
// @updateURL    https://cst1229.github.io/files/userscripts/shellfishpfps.user.js
// @downloadURL  https://cst1229.github.io/files/userscripts/shellfishpfps.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
	const kiwi = window.kiwi;
	
	if (kiwi.state.getSetting("user_settings.shellfishpfps.pfp") === undefined) {
		kiwi.state.setSetting("user_settings.shellfishpfps.pfp", "");
	}
	// irccloud avatars. pasted from kiwiirc docs lol
	document.body.appendChild(Object.assign(
		document.createElement("div"),
		{
			id: "irccloud_avatars",
			style: "width:1px;height:1px;position:absolute;left:-1000px;"
		}
	));
	kiwi.on('irc.userlist', function(event, network) {
		const scratch = document.querySelector('#irccloud_avatars');

		event.users.forEach(function(user) {
			// first, ask the user for their pfp through ctcp
			network.frameworkClient.ctcpRequest(user.nick, "PFP");
			
			const m = user.ident.match(/^uid|sid([0-9]+)$/);
			if (m) {
				const avatarUrl = 'https://static.irccloud-cdn.com/avatar-redirect/' + m[1];
				const img = document.createElement('img');
				img.src = avatarUrl;

				// irccloud replies with a 404 if an avatar doesn't exist, so this onload callback
				// will only be called for successful avatars
				img.onload = function() {
					kiwi.state.addUser(network.id, {nick: user.nick, avatar: {
						small: avatarUrl,
					}});

					scratch.removeChild(img);
				};

				img.onerror = function() {
					scratch.removeChild(img);
				};

				scratch.appendChild(img);
			}
		});
	});

	kiwi.on("irc.ctcp request", function(event, network, ircEventObj) {
		if (event.type !== "PFP") return;
		const returnVal = event.message.substring(event.type.length + 1);
		try {
			new URL(returnVal);
			
			// someone sent the pfp to the client by themselves
			// instead of responding to a request
			kiwi.state.addUser(network.id, {nick: event.nick, avatar: {
				small: returnVal,
			}});
		} catch (e) {}
		
		let target = event.from_server ?
			event.hostname :
			event.nick;

		const pfp = kiwi.state.getSetting("user_settings.shellfishpfps.pfp");
		let pfpUrl = "";
		if (pfp) pfpUrl = pfp;

		network.frameworkClient.ctcpResponse(target, "PFP", pfp);
	});
	kiwi.on("irc.ctcp response", function(event, network, ircEventObj) {
		if (event.type !== "PFP") return;

		const returnVal = event.message.substring(event.type.length + 1);
		try {
			new URL(returnVal);
		} catch (e) {
			return;
		}

		kiwi.state.addUser(network.id, {nick: event.nick, avatar: {
			small: returnVal,
		}});
	});
	kiwi.on("network.connecting", function(connectingEvent) {
		const pfp = kiwi.state.getSetting("user_settings.shellfishpfps.pfp");

		try {
			new URL(pfp);
		} catch (e) {
			return;
		}
		
		kiwi.on("irc.connected", function(connectedEvent) {
			kiwi.state.addUser(connectingEvent.network.id, {nick: connectedEvent.nick, avatar: {
				small: pfp,
			}});
		});
	});
	
	console.log("pfps thing started", kiwi);
})();
