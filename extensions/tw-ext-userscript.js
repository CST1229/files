/**
 * TurboWarp Blocks, loosely ported to a userscript so that it can be loaded in E羊icques.
 * @constructor
 */
class TurboWarpBlocks {
    constructor (runtime) {
		    this.runtime = runtime;
        this.lastKeyPressed = "";
        this.mouseBtns = new Set();
        document.addEventListener("keydown", e => this.lastKeyPressed = runtime.ioDevices.keyboard._keyStringToScratchKey(e.key));
        document.addEventListener("mousedown", e => this.mouseBtns.add(e.button));
        document.addEventListener("mouseup", e => this.mouseBtns.delete(e.button));
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'tw',
            name: 'TurboWarp',
            color1: '#ff4c4c',
            color2: '#e64444',
            docsURI: 'https://docs.turbowarp.org/blocks',
            blocks: [
                {
                    opcode: 'getLastKeyPressed',
                    text: 'last key pressed',
                    disableMonitor: true,
                    blockType: "reporter"
                },
                {
                    opcode: 'getButtonIsDown',
                    text: '[MOUSE_BUTTON] mouse button down?',
                    blockType: "Boolean",
                    arguments: {
                        MOUSE_BUTTON: {
                            type: "number",
                            menu: 'mouseButton',
                            defaultValue: '0'
                        }
                    }
                }
            ],
            menus: {
                mouseButton: {
                    items: [
                        {
                            text: '(0) primary',
                            value: '0'
                        },
                        {
                            text: '(1) middle',
                            value: '1'
                        },
                        {
                            text: '(2) secondary',
                            value: '2'
                        }
                    ],
                    acceptReporters: true
                }
            }
        };
    }

    getLastKeyPressed (args, util) {
        return this.lastKeyPressed;
    }

    getButtonIsDown (args, util) {
        const button = Cast.toNumber(args.MOUSE_BUTTON);
        return this.mouseBtns.has(button);
    }
}

(function() {
    const extensionInstance = new TurboWarpBlocks(window.vm.extensionManager.runtime);
    const serviceName = window.vm.extensionManager._registerInternalExtension(extensionInstance);
    window.vm.extensionManager._loadedExtensions.set(extensionInstance.getInfo().id, serviceName);
})();
