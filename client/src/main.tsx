import { inject } from "@vercel/analytics";
import { Buffer } from "buffer";
import React from "react";
import ReactDOM from "react-dom/client";
import { dojoConfig } from "../dojoConfig";
import { env } from "../env";
import App from "./App";
import { setup } from "./dojo/setup";
import { DojoProvider } from "./hooks/context/DojoContext";
import { StarknetProvider } from "./hooks/context/starknet-provider";
import "./index.css";
import GameRenderer from "./three/GameRenderer";
import { LoadingScreen } from "./ui/modules/LoadingScreen";
import { getRandomBackgroundImage } from "./ui/utils/utils";
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

window.Buffer = Buffer;

async function init() {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("React root not found");
  const root = ReactDOM.createRoot(rootElement as HTMLElement);

  const backgroundImage = getRandomBackgroundImage();

  if (env.VITE_PUBLIC_CONSTRUCTION_FLAG == true) {
    root.render(<LoadingScreen backgroundImage={backgroundImage} />);
    return;
  }

  root.render(<LoadingScreen backgroundImage={backgroundImage} />);

  const setupResult = await setup(dojoConfig);

  const graphic = new GameRenderer(setupResult);

  graphic.initScene();
  if (env.VITE_PUBLIC_SHOW_FPS == true) {
    graphic.initStats();
  }

  inject();
  root.render(
    <React.StrictMode>
      <StarknetProvider>
        <DojoProvider value={setupResult}>
          <App backgroundImage={backgroundImage} />
        </DojoProvider>
      </StarknetProvider>
    </React.StrictMode>,
  );
}

init();
