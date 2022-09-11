const fs = require("fs");

const templateCache = {};

const icons = {
	js: "🟨",
	ttf: "🅰️",
	html: "🌍",
	lnk: "↗️",
	file: "📄",
}

// basic "templating" system
function renderTemplate(name, props = {}) {
	try {
		if (!templateCache[name]) {
			templateCache[name] = fs.readFileSync(`index-assets/template-${name}.html`, "utf8");
		}
		let templateFile = templateCache[name];
		for (const prop of Object.keys(props)) {
			templateFile = templateFile.replaceAll(
				new RegExp(`\\{\\{${prop.replaceAll(/([^A-Za-z0-9])/g, "\\$1")}\\}\\}`, "g"),
				props[prop]
			);
		}
		return templateFile;
	} catch(e) {
		throw e;
	}
}

function renderDirectory(path, extraFiles = "") {
	let renderedDir = "";
	
	const dir = fs.readdirSync(path, {withFileTypes: true})
	
	let dirs = [];
	let files = [];
	for (const entry of dir) {
		if (entry.name === ".git") continue;
		if (entry.isDirectory()) {
			dirs.push(entry);
		} else if (entry.isFile()) {
			files.push(entry);
		}
	}
	
	for (const dir of dirs) {
		renderedDir += renderTemplate(
			"folder",
			{
				NAME: dir.name,
				CONTENT: renderDirectory(path + "/" + dir.name)
			}
		);
	}
	renderedDir += extraFiles;
	for (const file of files) {
		const splitName = file.name.split(".");
		renderedDir += renderTemplate(
			"file",
			{
				PATH: path,
				ICON: icons[splitName[splitName.length - 1]] || icons.file,
				FILENAME: file.name
			}
		);
	}
	
	return renderedDir;
}

const rendered = renderDirectory(
	".",
	renderTemplate(
		"file",
		{
			PATH: "https://github.com/cst1229/files",
			ICON: icons.lnk,
			FILENAME: "code"
		}
	)
);

fs.writeFileSync(
	"./index.html",
	renderTemplate(
		"page",
		{
			CONTENT: rendered
		}
	)
);
console.log("File written!");