// ==UserScript==
// @name         TurboWarp Scripts
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Quick userscript to load other userscripts on TurboWarp via load_plugin and project_plugin, because GarboMuffin won't do it.
// @author       CST1229
// @match        *://turbowarp.org/*
// @icon         https://www.google.com/s2/favicons?domain=turbowarp.org
// ==/UserScript==

async function loadScripts() {
  const searchParams = new URL(location.href).searchParams;
  function getUrl(url) {
    return searchParams.has("ao") ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` : url;
  }

  let scriptsToLoad = [];
  let extsToLoad = [];
  searchParams.forEach(function(value, name) {
    if (name === "load_plugin") {
      scriptsToLoad.push(value);
    }
    if (name === "project_plugin") {
      extsToLoad.push(value);
    }
  });
  const scriptsLoad = Promise.all(scriptsToLoad.map(url => fetch(getUrl(url))));
  const scriptsText = Promise.all((await scriptsLoad).map(resp => resp.text()));
  for (const script of await scriptsText) {
    (new Function(script))();
  };

  const extsLoad = Promise.all(extsToLoad.map(url => fetch(getUrl(url))));
  const extsText = Promise.all((await extsLoad).map(resp => resp.text()));

  vm.runtime.once("PROJECT_LOADED", async function() {
    for (const script of await extsText) {
      (new Function(script))();
    };
  });
}

function checkVm() {
  if (window.vm) {
    loadScripts();
  } else {
    setTimeout(checkVm, 250);
  }
}
checkVm();
