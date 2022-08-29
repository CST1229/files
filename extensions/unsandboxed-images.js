class ImagesExt {
	constructor (runtime, window, extensionId) {
		this.runtime = runtime;
		this.window = window;
		
		if (!runtime.renderer._layerGroups.imagesExt) {
			const layers = Object.keys(runtime.renderer._layerGroups);
			layers.unshift("imagesExt");
			runtime.renderer.setLayerGroupOrdering(layers);
		}
		
		// To prevent destroying of images that weren't made with the extension
		this.createdImages = new Set();
		
		this._createPenIfNeeded();
	}
	
	_createPenIfNeeded() {
		// If we haven't already, add the pen extension
		// and create a pen layer using its functions
		if (this.runtime.renderer._penSkinId) return;
		if (!this.runtime.ext_pen) {
			try {
				window.vm.extensionManager.loadExtensionIdSync("pen");
			} catch(e) {
				console.error("Error adding pen:", e);
				return;
			}
		}
		if (this.runtime.ext_pen) {
			this.runtime.ext_pen._getPenLayerID.call(this.runtime.ext_pen);
		}
	}

	getInfo() {
		return {
			"id": 'images',
			"name": 'Images',
			"blocks": [
				{
					"opcode": 'getImage',
					"blockType": "reporter",
					"text": 'new image from URL [IMAGEURL]',
					"arguments": {
						"IMAGEURL": {
							"type": "string",
							"defaultValue": 'https://svelte.meower.org/assets/logo.22ae43ae.svg',
						},
					},
				},
				{
					"opcode": 'drawImage',
					"blockType": "command",
					"text": 'stamp image [IMG] at x: [X] y: [Y] x scale: [XSCALE] y scale: [YSCALE]',
					"arguments": {
						"IMG": {
							"type": null,
							"defaultValue": '',
						},
						"X": {
							"type": "number",
							"defaultValue": '0',
						},
						"Y": {
							"type": "number",
							"defaultValue": '0',
						},
						"XSCALE": {
							"type": "number",
							"defaultValue": '100',
						},
						"YSCALE": {
							"type": "number",
							"defaultValue": '100',
						},
					},
				},
				{
					"opcode": 'deleteImage',
					"blockType": "command",
					"text": 'delete image [IMG]',
					"arguments": {
						"IMG": {
							"type": null,
							"defaultValue": '',
						},
					},
				}
			]
		};
	};
	
	async getImage({IMAGEURL}) {
		try {
			const resp = await fetch(IMAGEURL);
			const type = resp.headers.get("Content-Type");
			
			if (!resp.ok) {
				return "";
			}
			
			let skinId;
			switch (type) {
				case "image/svg+xml":
				case "image/svg":
					skinId = this.runtime.renderer.createSVGSkin(await resp.text());
				break;
				case "image/png":
				case "image/bmp":
				case "image/jpeg":
					const image = new Image();
					image.crossOrigin = "anonymous";
					image.src = IMAGEURL;
					await image.decode();
					skinId = this.runtime.renderer.createBitmapSkin(image, 1);
				break;
				default:
					return "";
				break;
			}
			
			const drawableId = this.runtime.renderer.createDrawable("imagesExt");
			const img = this.runtime.renderer._allDrawables[drawableId];
			img.updateVisible(false);
			img.skin = vm.runtime.renderer._allSkins[skinId];
			this.createdImages.add(drawableId);
			return drawableId;
		} catch(e) {
			console.error("Error creating image:", e);
			return "";
		}
	}
	drawImage({IMG, X, Y, XSCALE, YSCALE}) {
		try {
			if (!this.runtime.renderer._penSkinId) return;
			if (
				!this.runtime.renderer._allDrawables[IMG] || !this.createdImages.has(IMG)
			) return;
			this.runtime.renderer._allDrawables[IMG].updatePosition([
				Number(X) || 0,
				Number(Y) || 0,
			]);
			this.runtime.renderer._allDrawables[IMG].updateScale([
				XSCALE || 0,
				YSCALE || 0,
			]);
			this.runtime.renderer.penStamp(
				this.runtime.renderer._penSkinId, IMG
			);
		} catch(e) {
			console.error("Error drawing image:", e);
		}
	}
	deleteImage({IMG}) {
		try {
			if (
				!this.runtime.renderer._allDrawables[IMG] || !this.createdImages.has(IMG)
			) return;
			this.runtime.renderer.destroyDrawable(IMG, "imagesExt");
			this.createdImages.delete(IMG);
		} catch(e) {
			console.error("Error deleting image:", e);
		}
	}
};

const extensionClass = ImagesExt;
if (typeof window === "undefined" || !window.vm) {
	console.log("This extension cannot run in sandboxed mode.");
} else {
	const extensionInstance = new extensionClass(window.vm.extensionManager.runtime, window);
	const serviceName = window.vm.extensionManager._registerInternalExtension(extensionInstance);
	window.vm.extensionManager._loadedExtensions.set(extensionInstance.getInfo().id, serviceName);
	console.log("Unsandboxed mode detected. Good.");
};
