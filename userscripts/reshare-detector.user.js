// ==UserScript==
// @name         Reshare Detector
// @namespace    https://cst1229.github.io/
// @version      1.1.0
// @description  Adds a button to the top left corner of projects on the Scratch's Explore page to check if a project has been reshared or not (due to the reshare glitch). Inspired by Reshow: https://scratch.mit.edu/discuss/topic/664257/
// @author       CST1229
// @match        *://scratch.mit.edu/explore/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=scratch.mit.edu
// @updateURL    https://cst1229.github.io/files/userscripts/reshare-detector.user.js
// @downloadURL  https://cst1229.github.io/files/userscripts/reshare-detector.user.js
// @grant        none
// ==/UserScript==

(function() {
    "use strict";
	
	// make the browser load the image multiple times
	// (so animations play correctly)
	let counter = 0;
	
	const icons = {
		UNKNOWN: "data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_1_2)'%3E%3Crect width='16' height='16' fill='white'/%3E%3Ccircle cx='8' cy='8' r='7.5' stroke='%237F7F7F'/%3E%3Cpath d='M6 6C6 4 7.5 3.5 8.5 3.5C9.5 3.5 11 4.5 11 6C11 7.5 8 7.5 8 10' stroke='%237F7F7F' stroke-width='2'/%3E%3Ccircle cx='8' cy='12' r='1' fill='%237F7F7F'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_1_2'%3E%3Crect width='16' height='16'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E%0A",
		LOADING: "data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_4_8)'%3E%3Crect width='16' height='16' fill='white'/%3E%3Ccircle cx='8' cy='8' r='7.5' stroke='%237F7F7F'/%3E%3Cpath id='spinner' d='M11 10.4136C10.2364 11.3468 9.10241 12 7.96842 12C5.98421 12 4 10 4 8C4 6 5.98421 4 7.96842 4C9.10241 4 10.2364 4.65324 11 5.58638' stroke='%237F7F7F' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Cdefs%3E%3C/defs%3E%3Cstyle%3E%0A@keyframes spin %7B%0Afrom %7B%0Atransform: rotate(0turn);%0A%7D%0Ato %7B%0Atransform: rotate(1turn);%0A%7D%0A%7D%0A%23spinner %7B%0Aanimation: spin 0.5s linear infinite running;%0Atransform-origin: 8px;%0A%7D%0A%3C/style%3E%3C/svg%3E%0A",
		GOOD: "data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Crect width='16' height='16' fill='white'/%3E%3Ccircle cx='8' cy='8' r='7.5' stroke='%231DB940'/%3E%3Cpath clip-path='url(%23clip)' d='M4 8L6.66667 11L12 5' stroke='%231DB940' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip'%3E%3Crect id='clipRect' width='16' height='16'/%3E%3C/clipPath%3E%3C/defs%3E%3Cstyle%3E%0A@keyframes clip %7B%0Afrom %7B%0Atransform: translateX(-16px);%0A%7D%0Ato %7B%0Atransform: translateX(0);%0A%7D%0A%7D%0A%23clipRect %7B%0Aanimation: clip 0.25s ease-out running;%0A%7D%0A%3C/style%3E%3C/svg%3E%0A",
		RESHARED: "data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Crect width='16' height='16' fill='white'/%3E%3Ccircle cx='8' cy='8' r='7.5' stroke='%23FF6767'/%3E%3Cpath d='M5 5L11 11' clip-path='url(%23clip1)' stroke='%23FF6767' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M5 11L11 5' clip-path='url(%23clip2)' stroke='%23FF6767' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip1'%3E%3Crect id='clipRect1' width='16' height='16'/%3E%3C/clipPath%3E%3CclipPath id='clip2'%3E%3Crect id='clipRect2' width='16' height='16'/%3E%3C/clipPath%3E%3C/defs%3E%3Cstyle%3E%0A@keyframes clip %7B%0Afrom %7B%0Atransform: translateX(-16px);%0A%7D%0Ato %7B%0Atransform: translateX(0);%0A%7D%0A%7D%0A@keyframes clip-right %7B%0Afrom %7B%0Atransform: translateX(16px);%0A%7D%0Ato %7B%0Atransform: translateX(0);%0A%7D%0A%7D %23clipRect1 %7B%0Aanimation: clip 0.25s ease-out both running;%0A%7D%0A%23clipRect2 %7B%0Aanimation: clip-right 0.25s ease-out 0.15s both running;%0A%7D%0A%3C/style%3E%3C/svg%3E%0A",
		UNSHARED: "data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Crect width='16' height='16' fill='white'/%3E%3Ccircle cx='8' cy='8' r='7.5' stroke='%234D97FF'/%3E%3Cpath clip-path='url(%23clip)' d='M4 8L6.66667 11L12 5' stroke='%234D97FF' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip'%3E%3Crect id='clipRect' width='16' height='16'/%3E%3C/clipPath%3E%3C/defs%3E%3Cstyle%3E%0A@keyframes clip %7B%0Afrom %7B%0Atransform: translateX(-16px);%0A%7D%0Ato %7B%0Atransform: translateX(0);%0A%7D%0A%7D%0A%23clipRect %7B%0Aanimation: clip 0.5s ease-out running;%0A%7D%0A%3C/style%3E%3C/svg%3E%0A",
		ERROR: "data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_4_31)'%3E%3Crect width='16' height='16' fill='white'/%3E%3Ccircle cx='8' cy='8' r='7.5' stroke='%23FF6767'/%3E%3Cpath class='qmark' d='M6 6.5C6 4.5 7.5 4 8.5 4C9.5 4 11 5 11 6.5C11 8 8 8 8 10.5' stroke='%23FF6767' stroke-width='2'/%3E%3Ccircle class='qmark' cx='8' cy='12.5' r='1' fill='%23FF6767'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_4_31'%3E%3Crect width='16' height='16'/%3E%3C/clipPath%3E%3C/defs%3E%3Cstyle%3E%0A@keyframes shake %7B%0Afrom %7B%0Atransform: translateX(0px);%0A%7D%0A25%25 %7B%0Atransform: translateX(2px);%0A%7D%0A50%25 %7B%0Atransform: translateX(0px);%0A%7D%0A75%25 %7B%0Atransform: translateX(-2px);%0A%7D%0Ato %7B%0Atransform: translateX(0px);%0A%7D%0A%7D%0A.qmark %7B%0Aanimation: shake 0.1s linear 2 running;%0A%7D%0A%3C/style%3E%3C/svg%3E%0A",
	};
	const iconsColor = {
		UNKNOWN: "#7F7F7F",
		LOADING: "#7F7F7F",
		GOOD: "#1DB940",
		RESHARED: "#FF6767",
		UNSHARED: "#4D97FF",
		ERROR: "#FF6767",
	};
	const iconsText = {
		UNKNOWN: "",
		LOADING: "",
		GOOD: "Not Reshared",
		RESHARED: "Reshared",
		UNSHARED: "Unshared/Old",
		ERROR: "Error",
	};
	const iconsAlt = {
		UNKNOWN: "Click to check reshared status; shift-click to toggle always showing status",
		LOADING: "Loading...",
		GOOD: "Project has not been reshared (only shared once in past year)",
		RESHARED: "Project has been reshared in past year",
		UNSHARED: "Project is unshared or has not been shared in the past year",
		ERROR: "Error checking status, please try again.",
	};
	
	document.head.appendChild(
		Object.assign(document.createElement("style"), {
			textContent: `
				.thumbnail.project {
					position: relative;
					overflow: hidden;
				}
				.rsd-button {
					position: absolute;
					top: 0px;
					left: 0px;
					
					padding: 0;
					padding-left: 8px;
					padding-top: 8px;
					height: 24px;
					cursor: pointer;
					
					background-color: white;
					border: none;
					border-radius: 0 0 4px 0;
					box-sizing: content-box;
					appearance: none;
					
					display: inline-flex;
					align-items: center;
					justify-content: center;
					
					opacity: 0;
					transition: opacity 0.033s linear;
				}
				
				.rsd-icon {
					margin: 0 3px;
				}
				
				.thumbnail.project:hover .rsd-button,
				.thumbnail.project .rsd-button.always-show {
					opacity: 1;
				}
				
				:root.rsd-always-show .rsd-button {
					opacity: 1;
				}
				
				.rsd-text {
					font-weight: bold;
					margin-left: 2px;
					margin-right: 5px;
				}
				
				:root:not(.rsd-always-show) .rsd-text, .rsd-text.rsd-empty {
					display: none;
				}
		`})
	);
	
	function setIcon(el, type, moreText = "") {
		el.src = icons[type] + "#" + (counter++);
		if (el.parentElement && el.parentElement.querySelector(".rsd-text")) {
			const text = el.parentElement.querySelector(".rsd-text");
			text.style.color = iconsColor[type];
			text.textContent = iconsText[type];
			if (text.textContent === "") {
				text.classList.add("rsd-empty");
			} else {
				text.classList.remove("rsd-empty");
			}
		}
		
		let alt = (iconsAlt[type]) || "This message should not appear";
		if (moreText) alt += ` (${moreText})`;
		el.alt = alt;
		el.title = alt;
	}
	
	function getShareCount(doc, id) {
		let shareCount = 0;
		let shareTimes = [];
		for (const li of doc.querySelectorAll("li")) {
			if (!li.querySelector(".icon-xs.black.project")) continue;
			
			const els = li.querySelectorAll("a");
			if (!els.length) throw new Error("This error should not appear");
			// account for remixes
			const a = els[els.length - 1];
			
			if (a.href.endsWith(`/projects/${id}/`)) {
				shareCount++;
				shareTimes.push(li.querySelector(".time").textContent || "This message should not appear");
			}
		}
		return {shareCount, shareTimes};
	}
	
	function added(el) {
		if (!el.parentElement.querySelector(".thumbnail-creator a")) return;
		
		const creator = el.parentElement.querySelector(".thumbnail-creator a").textContent.replaceAll(/[^\w\-]/gi, "");
		
		el.dataset.rsdSeen = true;
		const projectId = Number(el.href.match(/\d+/));
		if (!projectId) return;
		
		const card = el.parentElement;
		const btn = document.createElement("button");
		btn.className = "rsd-button";
		card.prepend(btn);
		
		const icon = document.createElement("img");
		icon.width = 18;
		icon.height = 18;
		icon.className = "rsd-icon";
		
		const text = document.createElement("span");
		text.className = "rsd-text";
		
		btn.appendChild(icon);
		btn.appendChild(text);
		
		setIcon(icon, "UNKNOWN");
		
		let loading = false;
		btn.addEventListener("click", async (ev) => {
			if (loading) return;
			if (ev.shiftKey) {
				document.documentElement.classList.toggle("rsd-always-show");
				return;
			}
			try {
				btn.classList.add("always-show");
				setIcon(icon, "LOADING");
				
				const resp = await fetch(`https://scratch.mit.edu/messages/ajax/user-activity/?user=${creator}&max=1000`);
				if (!resp.ok) throw new Error("Got response code:", resp.status, resp.statusText);
				const text = await resp.text();
				
				const doc = (new DOMParser()).parseFromString(text, "text/html");
				const {shareCount, shareTimes} = getShareCount(doc, projectId);
				const shareTimesText = shareTimes.join("; ");
				
				if (shareCount === 0) {
					setIcon(icon, "UNSHARED");
				} else if (shareCount === 1) {
					setIcon(icon, "GOOD", shareTimesText);
				} else {
					setIcon(icon, "RESHARED", shareTimesText);
				}
			} catch(e) {
				console.error(e);
				setIcon(icon, "ERROR", e);
			} finally {
				btn.classList.remove("always-show");
				loading = false;
			}
		});
	}
	
    const observer = new MutationObserver(() => {
        const els = document.querySelectorAll(".thumbnail.project > a:not([data-rsd-seen])[href]");
		for (const el of els) added(el);
    });
	
    observer.observe(document.body, {
		subtree: true,
		childList: true,
		attributes: true,
	});
})();
