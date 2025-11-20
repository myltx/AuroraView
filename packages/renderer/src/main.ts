import "./style.css";
import App from "./App.vue";
import { createApp } from "vue";

if (!document.documentElement.dataset.theme) {
  document.documentElement.dataset.theme = "light";
}

createApp(App).mount("#app");
