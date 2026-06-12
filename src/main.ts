import { startApp } from "./render/app";

const root = document.getElementById("app");
if (!root) throw new Error("#app root element missing");
void startApp(root);
