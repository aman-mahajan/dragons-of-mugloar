import { useState } from "react";
import { Home } from "./components/Home";
import { Mode, Play } from "./components/Play";

export default function App() {
  const [screen, setScreen] = useState<"home" | "play">("home");
  const [playMode, setPlayMode] = useState<Mode>("new");
  const [playKey, setPlayKey] = useState(0);

  function openPlay(mode: Mode) {
    setPlayMode(mode);
    setPlayKey((k) => k + 1);
    setScreen("play");
  }

  return (
    <div className="app">
      <header>
        <h1>Dragons of Mugloar</h1>
      </header>
      {screen === "home" ? (
        <Home onNewGame={() => openPlay("new")} onLoadGame={() => openPlay("load")} />
      ) : (
        <Play key={playKey} mode={playMode} onHome={() => setScreen("home")} />
      )}
    </div>
  )
}
