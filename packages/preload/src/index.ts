import { sha256sum } from "./nodeCrypto.js";
import { versions } from "./versions.js";
import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("electron", {
  toggleFullscreen: () => ipcRenderer.send("toggle-fullscreen"),
});
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer,
  selectImages: () => ipcRenderer.invoke("select-images"),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
});
function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

export { sha256sum, versions, send };
