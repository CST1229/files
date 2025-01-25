// ==UserScript==
// @name         Snap! Block Drop Fix
// @namespace    https://cst1229.github.io/
// @version      1.0
// @description  Forces dropped URLs to drop as files, which combined with a CORS browser extension allows dropping blocks from other websites.
// @author       CST1229
// @match        https://snap.berkeley.edu/snap/*
// @match        https://snap.berkeley.edu/versions/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=snap.berkeley.edu
// @grant        none
// ==/UserScript==

/* global HandMorph MorphicPreferences newCanvas Point */

// i guess this userscript is AGPL-3.0 licensed because this pastes a sizeable portion of Snap! code which is AGPL-3.0

(function() {
    "use strict";
	
	/*
		diff:
			suffix = url.slice(url.lastIndexOf('.') + 1).toLowerCase();
			if (
				contains(
					['gif', 'png', 'jpg', 'jpeg', 'bmp'],
					suffix
				)
			) {
				// CST MODIFIED START
				fetch(url).then(res => res.blob()).then(blob => {
					const file = new File([blob], url.slice(url.lastIndexOf('/') + 1));
					readImage(file);
				});
				// CST MODIFIED END
			} else if (suffix === 'svg' && !MorphicPreferences.rasterizeSVGs) {
	*/
	if (!window?.HandMorph?.prototype?.processDrop) {
		console.error("BLOCK DROP FIX: HandMorph does not exist! This might not be Snap!.");
		return;
	}
	if (HandMorph.prototype.processDrop.toString().length !== 8309) {
		console.error("BLOCK DROP FIX: HandMorph.prototype.processDrop was updated/modified in some other way! Please update the userscript as well.");
		console.error("Exiting for safety.");
		return;
	}
	
	HandMorph.prototype.processDrop = function (event) {
	/*
		find out whether an external image or audio file was dropped
		onto the world canvas, turn it into an offscreen canvas or audio
		element and dispatch the

			droppedImage(canvas, name, embeddedData)
			droppedSVG(image, name)
			droppedAudio(audio, name)
			droppedText(text, name, type)

		events to interested Morphs at the mouse pointer.

		In case multiple files are dropped simulateneously also displatch
		the events

			beginBulkDrop()
			endBulkDrop()

		to Morphs interested in bracketing the bulk operation
	*/
		var files = event instanceof FileList ? event
					: event.target.files || event.dataTransfer.files,
			file,
			fileCount,
			url = event.dataTransfer ?
					event.dataTransfer.getData('URL') : null,
			txt = event.dataTransfer ?
					event.dataTransfer.getData('Text/HTML') : null,
			suffix,
			src,
			target = this.morphAtPointer(),
			img = new Image(),
			canvas,
			i;

		function readSVG(aFile) {
			var pic = new Image(),
				frd = new FileReader(),
				trg = target;
			while (!trg.droppedSVG) {
				trg = trg.parent;
			}
			pic.onload = () => {
				trg.droppedSVG(pic, aFile.name);
				bulkDrop();
			};
			frd = new FileReader();
			frd.onloadend = (e) => pic.src = e.target.result;
			frd.readAsDataURL(aFile);
		}

		function readImage(aFile) {
			var pic = new Image(),
				frd = new FileReader(),
				trg = target,
				embedTag = MorphicPreferences.pngPayloadMarker;

			while (!trg.droppedImage) {
				trg = trg.parent;
			}
					
			pic.onload = () => {
				(async () => {
					// extract embedded data (e.g. blocks)
					// from the image's metadata if present
					var buff = new Uint8Array(await aFile?.arrayBuffer()),
						strBuff = buff.reduce((acc, b) =>
							acc + String.fromCharCode(b), ""),
						embedded;

					if (strBuff.includes(embedTag)) {
						try {
							embedded = decodeURIComponent(
								(strBuff)?.split(embedTag)[1]
							);
						} catch (err) {
							console.log(err);
						}
					}
					canvas = newCanvas(new Point(pic.width, pic.height), true);
					canvas.getContext('2d').drawImage(pic, 0, 0);
					trg.droppedImage(canvas, aFile.name, embedded);
					bulkDrop();
				})();
			};

			frd = new FileReader();
			frd.onloadend = (e) => pic.src = e.target.result;
			frd.readAsDataURL(aFile);
		}

		function readAudio(aFile) {
			var snd = new Audio(),
				frd = new FileReader(),
				trg = target;
			while (!trg.droppedAudio) {
				trg = trg.parent;
			}
			frd.onloadend = (e) => {
				snd.src = e.target.result;
				trg.droppedAudio(snd, aFile.name);
				bulkDrop();
			};
			frd.readAsDataURL(aFile);
		}

		function readText(aFile) {
			var frd = new FileReader(),
				trg = target;
			while (!trg.droppedText) {
				trg = trg.parent;
			}
			frd.onloadend = (e) => {
				trg.droppedText(e.target.result, aFile.name, aFile.type);
				bulkDrop();
			};
			frd.readAsText(aFile);
		}

		function readBinary(aFile) {
			var frd = new FileReader(),
				trg = target;
			while (!trg.droppedBinary) {
				trg = trg.parent;
			}
			frd.onloadend = (e) => {
				trg.droppedBinary(e.target.result, aFile.name);
				bulkDrop();
			};
			frd.readAsArrayBuffer(aFile);
		}

		function beginBulkDrop() {
			var trg = target;
			while (!trg.beginBulkDrop) {
				trg = trg.parent;
			}
			trg.beginBulkDrop();
		}

		function bulkDrop() {
			var trg = target;
				fileCount -= 1;
			if (files.length > 1 && fileCount === 0) {
				while (!trg.endBulkDrop) {
					trg = trg.parent;
				}
				trg.endBulkDrop();
			}
		}

		function readURL(url, callback) {
			var request = new XMLHttpRequest();
			request.open('GET', url);
			request.onreadystatechange = () => {
				if (request.readyState === 4) {
					if (request.responseText) {
						callback(request.responseText);
					} else {
						throw new Error('unable to retrieve ' + url);
					}
				}
			};
			request.send();
		}

		function parseImgURL(html) {
			var iurl = '',
				idx,
				c,
				start = html.indexOf('<img src="');
			if (start === -1) {return null; }
			start += 10;
			for (idx = start; idx < html.length; idx += 1) {
				c = html[idx];
				if (c === '"') {
					return iurl;
				}
				iurl = iurl.concat(c);
			}
			return null;
		}

		if (files.length > 0) {
			fileCount = files.length;
			if (fileCount > 1) {
				beginBulkDrop();
			}
			for (i = 0; i < files.length; i += 1) {
				file = files[i];
				suffix = file.name.slice(
					file.name.lastIndexOf('.') + 1
				).toLowerCase();
				if (file.type.indexOf("svg") !== -1
						&& !MorphicPreferences.rasterizeSVGs) {
					readSVG(file);
				} else if (file.type.indexOf("image") === 0) {
					readImage(file);
				} else if (file.type.indexOf("audio") === 0 ||
						file.type.indexOf("ogg") > -1) {
						// check the file-extension because Firefox
						// thinks OGGs are videos
					readAudio(file);
				} else if ((file.type.indexOf("text") === 0) ||
						contains(['txt', 'csv', 'json'], suffix)) {
						// check the file-extension because Windows
						// doesn't specify CSVs to be text/csv, sigh
					readText(file);
				} else { // assume it's meant to be binary
					readBinary(file);
				}
			}
		} else if (url) {
			suffix = url.slice(url.lastIndexOf('.') + 1).toLowerCase();
			if (
				contains(
					['gif', 'png', 'jpg', 'jpeg', 'bmp'],
					suffix
				)
			) {
				// CST MODIFIED START
				fetch(url).then(res => res.blob()).then(blob => {
					const file = new File([blob], url.slice(url.lastIndexOf('/') + 1));
					readImage(file);
				});
				// CST MODIFIED END
			} else if (suffix === 'svg' && !MorphicPreferences.rasterizeSVGs) {
				while (!target.droppedSVG) {
					target = target.parent;
				}
				readURL(
					url,
					txt => {
						var pic = new Image();
						pic.onload = () => {
							target.droppedSVG(
								pic,
								url.slice(
									url.lastIndexOf('/') + 1,
									url.lastIndexOf('.')
								)
							);
						};
						pic.src = 'data:image/svg+xml;utf8,' +
							encodeURIComponent(txt);
					}
				);
			}
		} else if (txt) {
			while (!target.droppedImage) {
				target = target.parent;
			}
			img = new Image();
			img.onload = () => {
				canvas = newCanvas(new Point(img.width, img.height), true);
				canvas.getContext('2d').drawImage(img, 0, 0);
				target.droppedImage(canvas);
			};
			src = parseImgURL(txt);
			if (src) {img.src = src; }
		}
	};
})();
