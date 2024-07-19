// ==UserScript==
// @name         upload⁴
// @namespace    https://cst1229.github.io/
// @version      1.0.0
// @description  A userscript for cubeupload that lets you upload files from the clipboard, rename uploaded files and try to persist logins between sessions (see cubeupload's settings page for settings).
// @author       CST1229
// @match        https://cubeupload.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cubeupload.com
// @updateURL    https://cst1229.github.io/files/userscripts/upload4.user.js
// @downloadURL  https://cst1229.github.io/files/userscripts/upload4.user.js
// @grant        none
// ==/UserScript==

/* global uploader */

(function() {
    "use strict";
	
	const persistLoginKey = "upload4_persistLogin";
	
	updatePersistentLogin();
	if (location.pathname === "/settings") {
		settingsStuff();
		return;
	}

    const loggedIn = !!window.uploader;
    if (!loggedIn) return;

    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput) return;
	
	const style = document.createElement("style");
	style.textContent = `
		.file_name_container {
			width: 100%;
			text-align: left;
		}
		input.file_name {
			font-size: inherit;
			font-family: inherit;
			color: inherit;
			border: 1px solid black;
			background: #222;
			width: calc(100% - 30px);
			height: 30px;
			padding-left: 4px;
		}
	`;
	document.head.appendChild(style);

    // image file types compatible with cubeupload
    const compatibleImages = ["image/png", "image/bmp", "image/jpeg", "image/gif", "application/pdf"];

	// https://github.com/whatwg/html/issues/3269#issuecomment-349098245
	function newFileList() {
		const dt = new DataTransfer();
		if (arguments[0] !== undefined) {
			for (const file of arguments[0]) dt.items.add(file);
		}
		const fl = dt.files;
		Object.defineProperty(fl, 'append', {value: file => { dt.items.add(file); }});
		return fl;
	}
	
	function splitFilename(name) {
		let dotIndex = name.lastIndexOf(".");
		if (dotIndex === -1) dotIndex = name.length;
		return [name.substring(0, dotIndex), name.substring(dotIndex)];
	}
	
	function getUniqueFileName(name) {
		let i = 1;
		const [filename, extension] = splitFilename(name);
		const matchFile = (file) => file.name === name;
		
		do {
			name = `${filename}${i === 1 ? "" : ("_" + i)}${extension}`
			i++;
		} while (uploader.files.some(matchFile))
		return name;
	}
	
	function renameFile(uploaderFile, newName) {
		uploaderFile.name = newName;
		uploaderFile.nativeFile.upload4_newfilename = newName;
		const newFile = new File([uploaderFile.nativeFile], newName, {type: uploaderFile.nativeFile.type});
		uploaderFile.nativeFile = newFile;
		uploaderFile.img.file = newFile;
	}
	
    document.addEventListener("paste", (e) => {
		const images = [];
        for (const file of e.clipboardData.files) {
			if (compatibleImages.includes(file.type)) {
				images.push(file);
			}
        }
		if (images.length <= 0) return;
		e.preventDefault();
		fileInput.files = newFileList(images);
		fileInput.dispatchEvent(new Event("change", {bubbles: true, cancelable: true, composed: true}));
    });
	
	uploader.bind("FilesAdded", function (up, files) {
		// ensure cubeupload's FilesAdded has a chance to run first
		queueMicrotask(() => {
			for (const file of files) {
				const el = document.getElementById(file.id);
				if (!el) continue;
				const existingInput = el.querySelector('input[class="file_name"]');
				if (existingInput) continue;

				const oldFileName = file.name;
				
				const label = el.querySelector('.file_name');
				const container = label.parentElement;
				label.remove();
				
				const inputContainer = document.createElement("div"); 
				inputContainer.className = "file_name_container";
				container.prepend(inputContainer);
				
				const input = document.createElement("input");
				input.className = "file_name";
				input.type = "text";
				input.value = oldFileName;
				input.addEventListener("change", function(ev) {
					let name = input.value.trim();
					if (name === "") name = oldFileName;
					name = getUniqueFileName(name);
					input.value = name;
					renameFile(file, name);
				});
				inputContainer.appendChild(input);
			}
		});
	});
	uploader.bind("UploadFile", function (up, file) {
		console.log(file, up);
	});
	
	// force cubeupload's uploader to send the correct file name
	const oldAppend = FormData.prototype.append;
	FormData.prototype.append = function(name, value, filename) {
		if (filename !== undefined) {
			return oldAppend.call(this, name, value, filename);
		} else if (value && value.upload4_newfilename) {
			return oldAppend.call(this, name, value, value.upload4_newfilename);
		} else {
			return oldAppend.call(this, name, value);
		}
	}
	
	function settingsStuff() {
		const settingsFormWrap = document.querySelector(".settingsFormWrap");
		if (!settingsFormWrap) return;
		
		const container = document.createElement("div");
		container.className = "settingsItemWrap settingsPad";
		
		const header = document.createElement("h1");
		header.className = "formHeader";
		header.textContent = "upload⁴ Settings";
		container.appendChild(header);
		
		const list = document.createElement("ul");
		list.className = "formList";
		container.appendChild(list);
		
		function createItem(width = 100) {
			const item = document.createElement("li");
			item.style.width = width + "%";
			item.className = "formList listChecked";
			list.appendChild(item);
			return item;
		}
		function createCheckbox(item, text, onChange, value = false) {
			const label = document.createElement("label");
			label.className = "buttonGrad";
			item.appendChild(label);
			
			const input = document.createElement("input");
			input.type = "checkbox";
			input.checked = value;
			input.addEventListener("change", onChange);
			label.appendChild(input);
			
			label.appendChild(document.createTextNode(" " + text));
			return [input, label];
		}
		
		const persistSetting = createItem();
		const persistCheck = createCheckbox(persistSetting, "Try to persist logins between sessions", function(e) {
			localStorage.setItem(persistLoginKey, e.target.checked);
			updatePersistentLogin();
		}, localStorage.getItem(persistLoginKey) == "true");
		
		settingsFormWrap.appendChild(container);
	}
	
	function updatePersistentLogin() {
		const persist = localStorage.getItem(persistLoginKey) == "true";
		const cookieStrings = document.cookie.split(";").map((item) => item.trim());
		const sessIdString = cookieStrings.find(str => str.startsWith("PHPSESSID="));
		if (!sessIdString) return;
		const sessId = sessIdString.substring("PHPSESSID=".length);
		
		if (persist) {
			document.cookie = `PHPSESSID=${sessId}; SameSite=None; max-age=31536000`;
		} else {
			document.cookie = `PHPSESSID=${sessId}; SameSite=None;`;
		}
	}
})();
