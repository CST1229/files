// ==UserScript==
// @name         Shellfish PFPs
// @namespace    https://cst1229.github.io/
// @version      0.9.1
// @description  Allows setting a PFP in shellfish (Kiwi IRC). To set your PFP, set shellfishpfps.pfp in the advanced settings to an image URL. In beta, stuff might break.
// @author       CST1229
// @match        https://web.libera.chat/*
// @match        https://kiwiirc.com/nextclient/*
// @icon         https://kiwiirc.com/favicon.ico
// @updateURL    https://cst1229.github.io/files/userscripts/shellfishpfps.user.js
// @downloadURL  https://cst1229.github.io/files/userscripts/shellfishpfps.user.js
// @grant        none
// ==/UserScript==

window.setTimeout(function() {
    'use strict';
	const kiwi = window.kiwi;
	
	if (!kiwi) return;
	
	if (kiwi.state.getSetting("user_settings.shellfishpfps.pfp") === undefined) {
		kiwi.state.setSetting("user_settings.shellfishpfps.pfp", "");
	}
	
	let pfpSetting = kiwi.state.getSetting("user_settings.shellfishpfps.pfp");
	
	kiwi.on('irc.userlist', function(event, network) {
		event.users.forEach(function(user) {
			network.frameworkClient.ctcpRequest(user.nick, "PFP");
		});
	});

	kiwi.on("irc.ctcp request", function(event, network, ircEventObj) {
		if (event.type !== "PFP") return;
		const returnVal = event.message.substring(event.type.length + 1);
		try {
			new URL(returnVal);
			
			// someone sent the pfp to the client by themselves
			// instead of responding to a request
			addPfp(network.id, event.nick, returnVal);
		} catch (e) {}
		
		let target = event.from_server ?
			event.hostname :
			event.nick;

		const pfp = kiwi.state.getSetting("user_settings.shellfishpfps.pfp");
		let pfpUrl = "";
		if (pfp) pfpUrl = pfp;
		
		sendPfp(network, true, target, pfp);
	});
	kiwi.on("irc.ctcp response", function(event, network, ircEventObj) {
		if (event.type !== "PFP") return;

		const returnVal = event.message.substring(event.type.length + 1);
		try {
			new URL(returnVal);
		} catch (e) {
			return;
		}
		
		addPfp(network.id, event.nick, returnVal);
	});
	kiwi.on("network.connecting", function(connectingEvent) {
		const pfp = kiwi.state.getSetting("user_settings.shellfishpfps.pfp");

		try {
			new URL(pfp);
		} catch (e) {
			return;
		}
		
		kiwi.once("irc.connected", function(connectedEvent) {
			addPfp(connectingEvent.network.id, connectingEvent.network.nick, pfp);
		});
	});
	
	function sendPfp(network, isReply, sendTo, pfp) {
		if (sendTo === network.nick) {
			addPfp(network.id, network.nick, pfp);
			return;
		}
		
		if (isReply) {
			network.frameworkClient.ctcpResponse(sendTo, "PFP", ((pfp || "-")));
		} else {
			network.frameworkClient.ctcpRequest(sendTo, "PFP", ((pfp || "-")));
		}
	}
	function addPfp(networkId, nick, pfp) {
		try {
			new URL(pfp);
			kiwi.state.addUser(networkId, {nick: nick, avatar: {
				small: pfp,
			}});
		} catch (e) {
			kiwi.state.addUser(networkId, {nick: nick, avatar: null});
		}
	}
	
	setInterval(() => {
		const kiwi = window.kiwi;
		
		if (pfpSetting !== kiwi.state.getSetting("user_settings.shellfishpfps.pfp")) {
			pfpSetting = kiwi.state.getSetting("user_settings.shellfishpfps.pfp");
			for (const network of kiwi.state.networks) {
				for (const user in network.users) {
					sendPfp(network, false, network.users[user].nick, pfpSetting);
				}
			}
		}
	}, 1000);
	
	console.log("pfps thing started", kiwi);
}, 1000);
