// ==UserScript==
// @name         Shellfish PFPs
// @namespace    https://cst1229.github.io/
// @version      1.0.2
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
	
	kiwi.on("irc.join", function(event, network) {
		const pfp = getPfp(network);
		if (event.nick === network.nick) {
			try {
				new URL(pfp);
				sendPfp(network, false, event.channel, pfp);
			} catch(e) {}
		} else {
			sendPfp(network, false, event.nick, pfp);
		}
	});

	kiwi.on("irc.ctcp request", function(event, network) {
		if (event.type !== "PFP") return;
		const returnVal = event.message.substring(event.type.length + 1);
		try {
			new URL(returnVal);
			
			// someone sent the pfp to the client by themselves
			// instead of responding to a request
			addPfp(network.id, event.nick, returnVal);
			return;
		} catch (e) {}
		
		let target = event.from_server ?
			event.hostname :
			event.nick;

		const pfpUrl = getPfp(network);
		let pfp = "-";
		if (pfpUrl) pfp = pfpUrl;
		
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
				sendPfpToNetwork(network, getPfp(network));
			}
		}
	}, 1000);
	
	function sendPfpToNetwork(network, pfp) {
		if (!network) return;
		
		addPfp(network.id, network.nick, pfp);
		for (const buffer of network.buffers) {
			if (!buffer.name) continue;
			if (buffer.name.startsWith("#")) sendPfp(network, false, buffer.name, pfp);
		}
	}
	
	function getPfp(network) {
		const defaultPfp = kiwi.state.getSetting("user_settings.shellfishpfps.pfp");
		const nickPfp = kiwi.state.getSetting("user_settings.shellfishpfps.pfp.nick." + network.nick);
		if (nickPfp !== undefined) return nickPfp;
		return defaultPfp;
	}
	
	console.log("pfps thing started", kiwi);
}, 1000);
