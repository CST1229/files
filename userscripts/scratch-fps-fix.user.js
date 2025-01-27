// ==UserScript==
// @name         Scratch FPS Fix
// @namespace    https://cst1229.github.io
// @version      1.1.0
// @description  TRIES to fix consistent project lag (projects running at 22 FPS) on Firefox. Not very tested
// @author       CST1229
// @match        https://turbowarp.org/*
// @match        https://scratch.mit.edu/projects/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=scratch.mit.edu
// @updateURL    https://cst1229.github.io/files/userscripts/scratch-fps-fix.user.js
// @downloadURL  https://cst1229.github.io/files/userscripts/scratch-fps-fix.user.js
// @grant        none
// ==/UserScript==

// version 1.0: initial release
// version 1.0.1: step only once per animation frame
// version 1.1: add support for a fully vanilla environment (no addons or turbowarp)

(async function() {
    'use strict';

	let vm;
	// if no #app exists, this is definitely not a project player page
	if (!document.querySelector("#app")) return;
	// try to get the vm a bunch of times in case it takes some time to load
	for (let vmTries = 20; vmTries > 0; vmTries--) {
		try {
			vm = window?.vm || window?.__addon?.tab?.traps?.vm || findVMFromDOM();
			if (vm) break;
		} catch(e) {
			console.error("Scratch FPS Fix: Got error!", e);
			continue;
		}
		await new Promise(res => setTimeout(res, 300));
	}
	if (!vm) return;
	
	// in fully vanilla Scratch scenarios
	function findVMFromDOM(root = null) {
		root ||= getReactInternalInstance(document.querySelector(".guiPlayer"))?.child?.sibling || getReactInternalInstance(document.querySelector(".gui"))?.return?.return?.return?.return;
		if (!root) return null;
		while (root) {
			if (root?.stateNode?.props?.vm) return root.stateNode.props.vm;
			root = root.child;
		}
		return null;
	}
	function getReactInternalInstance(el) {
		if (!el) return null;
		return el[Object.keys(el).find(o => o.startsWith("__reactInternalInstance")) || ""];
	}
	
	const customInterval = Symbol();
	const oldSetInterval = window.setInterval;
	const oldClearInterval = window.clearInterval;
	let customIntervals = false;
	
	window.setInterval = function(stepCallback, interval) {
		if (!customIntervals) return oldSetInterval(stepCallback, interval);
		let cancelled = false;
		
		let start = undefined;
		function step(time) {
			if (start === undefined) {
				start = time;
			}
			try {
				let stepped = false;
				while (time >= (start + interval)) {
					if (!stepped) stepCallback();
					stepped = true;
					start += interval;
				}
			} finally {
				requestAnimationFrame(step);
			}
		}
		requestAnimationFrame(step);
		
		return {
			[customInterval]: true,
			cancel() {
				cancelled = true;
			}
		}
	}
	window.clearInterval = function(interval) {
		if (interval && interval[customInterval]) {
			interval.cancel();
		} else {
			oldClearInterval(interval);
		}
	}
	
	const oldStart = vm.runtime.start;
	vm.runtime.start = function(...args) {
		try {
			customIntervals = true;
			return oldStart.apply(this, args);
		} finally {
			customIntervals = false;
		}
	}
	console.log("Scratch FPS Fix started.");
})();
