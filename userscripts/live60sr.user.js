// ==UserScript==
// @name         Live 60 Second Rule
// @namespace    https://cst1229.github.io/
// @version      1.0.0
// @description  Makes the 60 second rule timer count down on the TBGs posting page.
// @author       CST1229
// @match        https://tbgforums.com/forums/post.php?tid=*
// @icon         https://tbgforums.com/favicon.ico
// @grant        none
// ==/UserScript==

(()=>{
    "use strict";

    let sixtySR = document.querySelector("#posterror .box > .inbox.error-info > .error-list > li > strong");
	if (!sixtySR) return;

	if (!(sixtySR.textContent.includes("seconds have to pass between posts. Please wait"))) return;

	let secs = sixtySR.textContent.match(/[0-9]+/g)[1];
	if (!secs) return;

	let notSecs = sixtySR.textContent.split(secs);
	let reconstText = notSecs;
	reconstText.splice(1, 0, secs);

	console.log(sixtySR, reconstText, reconstText.join(""));
	const interval = window.setInterval(function() {
		secs--;
		if (secs < 0) {
			sixtySR.textContent = "You can now post again.";
			clearInterval(interval);
			return;
		}
		reconstText[1] = secs;
		sixtySR.textContent = reconstText.join("");
	}, 1000);
})();
