// ==UserScript==
// @name         BA Launcher Mod Loader Web Injector
// @namespace    https://cst1229.eu.org/
// @version      v1.0
// @description  Runs the BA Launcher Mod Loader on the web version of Barfy's Adventure. Does NOT modify the main page, go to https://web.barfy.net/modded instead.
// @author       CST1229
// @match        https://*.web.barfy.net/modded
// @run-at       document-start
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAOtJREFUOI2dkq8PgkAcxR9K0tndbcyZNFhkJka2GDGZSWSLxWDxPyCRaUb/BZIjQ2KMjdnZbEwTt4P7gfrSuy/3PjyO0wDg/Lq+8Ycuo5OmN4ub+2g9nCyHXOAZFACAqWtge1wDAPTuJjZIzIL62ANMv/EFIALIwrTlLgIArOw9nXENWMUeP5vPLIxtQtcDFcD0gSyPkOWRdI8S0JVzt+g5NOr9BMe3aBuRlADTF5/D2P4SIHtzGkoAVVLTX1nGhgJbyxtUSd0dKSW9SGybrneCjRjQ3L40JFgcSqFnwhoHSEPS69lwC8DW+kUfOqBIeOqVzB8AAAAASUVORK5CYII=
// @grant        none
// ==/UserScript==

/*
How to install (web):
- If you have a userscript manager browser extension (like Tampermonkey or Greasemonkey) installed:
	- Download and enable this userscript: https://cst1229.eu.org/BAMods/special-mods/ba_launcher_mod_loader_web_injector.user.js.
	- Then visit https://web.barfy.net/modded to use the mod loader.
	- The mod loader puts itself there; regular web.barfy.net remains the vanilla version!
- Or, if you have access to your browser's developer console (usually F12 or Ctrl+Shift+I, "Console" tab):
	- Go to https://web.barfy.net/modded. There will be a 404 page, this is normal.
	- Then, copy and paste the script at https://cst1229.eu.org/BAMods/special-mods/ba_launcher_mod_loader_web_injector.user.js into your browser's developer console.
	- The modded game should then start.
- Otherwise:
	- Sadly, you're out of luck. :( (unless Barfy adds an official modloader, but that's unlikely)
*/

(async function() {
	"use strict";
	
	const MODLOADER_URL = "https://files.cst1229.eu.org/mods/ba_launcher_mod_loader_web.zip";
	const mainPage = await (await fetch("/index.html")).text();
	document.write(
		mainPage
		.replaceAll(`{"args":[`, `{"mainPack": ${JSON.stringify(MODLOADER_URL)}, "args":[`)
	);
})();
