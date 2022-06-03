// ==UserScript==
// @name         BetterShellfish
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A userscript for shellfish (Kiwi IRC) that adds some stuff.
// @author       CST1229
// @match        https://web.libera.chat/*
// @match        https://kiwiirc.com/nextclient/*
// @icon         https://kiwiirc.com/favicon.ico
// @updateURL    https://cst1229.github.io/files/userscripts/bettershellfish.user.js
// @downloadURL  https://cst1229.github.io/files/userscripts/bettershellfish.user.js
// @grant        none
// @run-at document-idle
// ==/UserScript==

window.setTimeout(function() {
    'use strict';
	
	if (!document.querySelector(".kiwi-wrap")) return;
	
	const storage = window.localStorage;
	
	let styleEl;
	
	if (storage.getItem("bettershellfish-settings") === null) {
		setStorage({});
	}
	
    const usernameCSS = (nick = "", replace = "", showOG = false) => {
		nick = nick.replaceAll('"', '\\"');
		nick = nick.replaceAll('\n', '\\n');
		replace = replace.replaceAll('"', '\\"');
		replace = replace.replaceAll('\n', '\\n');
		return `
			.kiwi-messagelist-nick [data-nick="${nick.toLowerCase()}"],
			div[data-nick="${nick.toLowerCase()}"] .kiwi-nicklist-user-nick,
			.kiwi-nick[data-nick="${nick}"],
			.kiwi-avatar[data-nick="${nick.toLowerCase()}"] > .kiwi-avatar-inner,
			.kiwi-userbox-nick[data-bettershellfish-nick="${nick}"] {
				font-size: 0.001%;
			}
			.kiwi-messagelist-nick [data-nick="${nick.toLowerCase()}"]::before,
			div[data-nick="${nick.toLowerCase()}"] .kiwi-nicklist-user-nick::before,
			.kiwi-nick[data-nick="${nick}"]::before,
			.kiwi-avatar[data-nick="${nick.toLowerCase()}"] > .kiwi-avatar-inner::before {
				font-size: 10000000%;
			}
			.kiwi-messagelist-nick [data-nick="${nick.toLowerCase()}"]::before {
				content: " ${replace}:";
			}
			div[data-nick="${nick.toLowerCase()}"] .kiwi-nicklist-user-nick::before,
			.kiwi-nick[data-nick="${nick}"]::before,
			.kiwi-userbox-nick[data-bettershellfish-nick="${nick}"]::before {
				content: "${replace}${showOG ? " ("+nick+")" : ""}";
			}

			.kiwi-avatar[data-nick="${nick.toLowerCase()}"] > .kiwi-avatar-inner::before {
				content: "${replace[0]}";
			}
			.kiwi-userbox-nick[data-bettershellfish-nick="${nick}"]::before {
				font-size: 14000000%;
			}
			.kiwi-userbox-avatar .kiwi-avatar[data-nick="${nick.toLowerCase()}"] > .kiwi-avatar-inner::before {
				font-size: 30000000%;
			}
		`;
	};
	const colorCSS = (nick, color) => {
		nick = nick.replaceAll('"', '\\"');
		nick = nick.replaceAll('\n', '\\n');
		color = color.replaceAll('"', '');
		color = color.replaceAll('\n', '');
		
		return `
			.kiwi-avatar[data-nick="${nick.toLowerCase()}"] .kiwi-avatar-inner {
				background-color: ${color} !important;
			}
			.kiwi-messagelist-nick[data-nick="${nick.toLowerCase()}"],
			.kiwi-nicklist-user[data-nick="${nick.toLowerCase()}"] .kiwi-nicklist-user-nick,
			.kiwi-nick[data-nick="${nick}"],
			.kiwi-userbox-nick[data-bettershellfish-nick="${nick}"] {
				color: ${color} !important;
			}
		`;
	}
	
	
	
	
	function buildBSCSS() {
		let css = `
			/* Fix overridden nicks being taller */
			.kiwi-messagelist-message-privmsg .kiwi-messagelist-nick.kiwi-messagelist-nick {
				display: inline-block;
				height: 0;
				overflow: visible;
			}
			.kiwi-nicklist--avatars .kiwi-nicklist-user.kiwi-nicklist-user {
				line-height: unset;
				padding-bottom: 8px;
				overflow: visible;
			}
			.kiwi-messagelist-message--text .kiwi-messagelist-nick[data-v-09207a86] {
				margin-right: 4px;
			}
			
			.bettershellfish-usersettings.bettershellfish-usersettings label {
				cursor: auto;
				display: inline;
				margin-left: 5px;
			}
			.bettershellfish-usersettings input {
				margin-bottom: 8px;
				margin-right: 5px;
			}
			.bettershellfish-usersettings .u-form {
				display: flex;
				-webkit-box-orient: horizontal;
				-webkit-box-direction: normal;
				-ms-flex-direction: row;
				flex-direction: row;
				-webkit-box-pack: center;
				-ms-flex-pack: center;
				justify-content: center;
			}
			.bettershellfish-usersettings .u-input[type="color"] {
				padding: 3px;
			}
			.bettershellfish-usersettings .u-input[disabled] {
				opacity: 0.5;
			}
			.bettershellfish-usersettings .label-next-to-text {
				margin-top: 4px;
			}
		`;
		
		const s = getStorage();
		
		for (const nick in s.localUserEdits) {
			const user = s.localUserEdits[nick] ;
			
			if (user.nick) {
				css = css + usernameCSS(nick, user.nick, user.showOG || false);
			}
			if (user.color) {
				css = css + colorCSS(nick, user.color);
			}
		}
		
		return css;
	}
	function doBSCSS() {
		if (document.getElementById("bettershellfish-css")) {
			styleEl = document.getElementById("bettershellfish-css");
		} else {
			styleEl = document.documentElement.appendChild(document.createElement("style"));
			styleEl.id = "bettershellfish-css";
		}
		
		styleEl.textContent = buildBSCSS();
	}
	
	function setStorage(obj) {
		storage.setItem("bettershellfish-settings", JSON.stringify(obj));
		doBSCSS();
	}
	function getStorage() {
		return JSON.parse(storage.getItem("bettershellfish-settings"));
	}
	
	
	const observerFunc = function(mutationsList, observer) {
		const userboxNick = document.getElementsByClassName("kiwi-userbox-nick")[0];
		if (userboxNick) userboxNick.dataset.bettershellfishNick = userboxNick.textContent
		
		const settings = getStorage();
		const actions = document.getElementsByClassName("kiwi-userbox-actions")[0];
		if (actions) {
			if (document.getElementsByClassName("bettershellfish-usersettings").length === 0) {
				const userSettingsContainer = Object.assign(document.createElement("div"), {
					className: "bettershellfish-usersettings"
				});
				
				let nick;
				
				const createBr = () => userSettingsContainer.appendChild(document.createElement("br"));
				const createGroup = () => Object.assign(document.createElement("div"), {
					className: "u-form"
				});
				
				let localNameLabel = Object.assign(document.createElement("span"), {
					textContent: "Local nickname",
					className: "label-next-to-text"
				});
				let localNameInput = Object.assign(document.createElement("input"), {
					className: "u-input",
					type: "text",
					disabled: true,
					placeholder: "leave blank for default",
					value: "",
					name: "bettershellfish-localnameinput"
				});
				
				if (userboxNick) {
					nick = userboxNick.textContent;
					if (!settings.localUserEdits[nick]) settings.localUserEdits[nick] = {};
					localNameInput.value = settings.localUserEdits[nick].nick || "";
					localNameInput.disabled = false;
				}
				localNameInput.addEventListener("change", () => {
					const settings = getStorage();
					if (!settings.localUserEdits[nick]) settings.localUserEdits[nick] = {};
					settings.localUserEdits[nick].nick = localNameInput.value;
					
					setStorage(settings);
				});
				
				let showOGLabel = Object.assign(document.createElement("span"), {
					textContent: "Show original nickname"
				});
				let showOGInput = Object.assign(document.createElement("input"), {
					type: "checkbox",
					disabled: true,
					checked: false,
					name: "bettershellfish-showoginput"
				});
				
				if (userboxNick) {
					showOGInput.checked = !!settings.localUserEdits[nick].showOG;
					showOGInput.disabled = false;
				}
				showOGInput.addEventListener("click", () => {
					const settings = getStorage();
					if (!settings.localUserEdits[nick]) settings.localUserEdits[nick] = {};
					settings.localUserEdits[nick].showOG = showOGInput.checked;
					
					setStorage(settings);
				});
				
				let localColorLabel = Object.assign(document.createElement("span"), {
					textContent: "Local color"
				});
				let localColorInput = Object.assign(document.createElement("input"), {
					type: "color",
					disabled: true,
					name: "bettershellfish-localcolorinput",
					className: "u-input"
				});
				let localColorCheckbox = Object.assign(document.createElement("input"), {
					type: "checkbox",
					disabled: true,
					checked: false,
					name: "bettershellfish-localcolorcheckbox"
				});
				
				if (userboxNick) {
					localColorInput.value = settings.localUserEdits[nick].color || "#000000";
					localColorCheckbox.checked = settings.localUserEdits[nick].color !== undefined;
					localColorInput.disabled = !localColorCheckbox.checked;
					localColorCheckbox.disabled = false;
				}
				localColorInput.addEventListener("change", () => {
					const settings = getStorage();
					if (!settings.localUserEdits[nick]) settings.localUserEdits[nick] = {};
					settings.localUserEdits[nick].color = localColorInput.value;
					
					setStorage(settings);
				});
				localColorCheckbox.addEventListener("click", () => {
					const settings = getStorage();
					localColorInput.disabled = !localColorCheckbox.checked;
					if (localColorCheckbox.checked) {
						localColorInput.dispatchEvent(new Event("change"));
					} else {
						delete settings.localUserEdits[nick].color;
						setStorage(settings);
					}
				});
				
				const inputGroup1 = createGroup();
				inputGroup1.appendChild(localNameInput);
				inputGroup1.appendChild(localNameLabel);
				userSettingsContainer.appendChild(inputGroup1);
				const inputGroup2 = createGroup();
				inputGroup2.appendChild(showOGInput);
				inputGroup2.appendChild(showOGLabel);
				userSettingsContainer.appendChild(inputGroup2);
				const inputGroup3 = createGroup();
				inputGroup3.appendChild(localColorInput);
				inputGroup3.appendChild(localColorCheckbox);
				inputGroup3.appendChild(localColorLabel);
				userSettingsContainer.appendChild(inputGroup3);
				actions.appendChild(userSettingsContainer);
			}
		}
	}; 
	const observer = new MutationObserver(observerFunc);
	observer.observe(document.body, { childList: true, subtree: true });
	
	
	doBSCSS();
	
	window.betterShellfish = {
		doBSCSS,
		buildBSCSS,
		styleEl,
		setStorage,
		getStorage,
		observer,
		observerFunc,
	};
}, 2000);
