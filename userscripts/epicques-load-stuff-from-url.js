vm.runtime.once("PROJECT_LOADED", async function() {
  const searchParams = new URL(location.href).searchParams;
  const projectUrl = searchParams.get("project_url");
  let extsToLoad = [];
  searchParams.forEach(function(value, name) {
    if (name === "unsandboxed_extension") {
      extsToLoad.push(value);
    }
  });
  const extsLoad = Promise.all(extsToLoad.map(url => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)));
  const extsText = Promise.all((await extsLoad).map(resp => resp.text()));
  
  for (const script of await extsText) {
    (new Function(script))();
  };
  
  if (!projectUrl) return;
  
  vm.loadProject(await (await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(projectUrl)}`)).arrayBuffer());
});
