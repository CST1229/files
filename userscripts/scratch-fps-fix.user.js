// ==UserScript==
// @name         Scratch FPS Fix
// @namespace    https://cst1229.github.io
// @version      1.0
// @description  TRIES to fix consistent project lag (projects running at 22 FPS) on Firefox. Not very tested
// @author       CST1229
// @match        https://turbowarp.org/*
// @match        https://scratch.mit.edu/projects/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=scratch.mit.edu
// @updateURL    https://cst1229.github.io/files/userscripts/scratch-fps-fix.user.js
// @downloadURL  https://cst1229.github.io/files/userscripts/scratch-fps-fix.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

	let vm;
	try {
		vm = window?.vm || window?.__addon?.tab?.traps?.vm
		if (!vm) return;
	} catch(e) {
		return;
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
				while (time >= (start + interval)) {
					stepCallback();
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
