import { ArcRotateCamera, Color3, Engine, HemisphericLight, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import RAPIER from "@dimforge/rapier3d-compat";
import { completeMission, getMe, getMissions, login, logout, saveProgress, setUsername } from "./auth/api";
import { DEFAULT_LANGUAGE, GAME_SUBTITLE, GAME_TITLE, GAME_VERSION, PHYSICS_SETTINGS } from "./core/gameConfig";
import { normalizeMissionCards } from "./missions/missionCarousel";
import { createAstronaut } from "./procedural/Astronaut";
import { createRocket } from "./procedural/Rocket";
import "./styles.css";

type ResourceState = {
  budget: number;
  mass: number;
  fuel: number;
  energy: number;
  communication: number;
  time: number;
  scienceCapacity: number;
};

const app = document.querySelector<HTMLDivElement>("#app")!;
let missionKeyHandler: ((event: KeyboardEvent) => void) | null = null;

function setScreen(html: string) {
  app.innerHTML = html;
}

function clearMissionKeyHandler() {
  if (missionKeyHandler) {
    window.removeEventListener("keydown", missionKeyHandler);
    missionKeyHandler = null;
  }
}

async function init() {
  showSplash();
  setTimeout(showLogin, 1800);
}

function showSplash() {
  setScreen(`
    <section class="screen">
      <h1 class="title">${GAME_TITLE}</h1>
      <p>${GAME_SUBTITLE}</p>
      <small>v${GAME_VERSION} • ${DEFAULT_LANGUAGE.toUpperCase()}</small>
    </section>
  `);
}

function showLogin() {
  clearMissionKeyHandler();
  setScreen(`
    <section class="screen">
      <h2>${GAME_TITLE}</h2>
      <p>Inicia sesión para comenzar tu campaña espacial.</p>
      <button data-provider="google">Continuar con Google</button>
      <button data-provider="apple">Continuar con Apple</button>
      <button data-provider="github">Continuar con GitHub</button>
      <small>OAuth callback endpoints listos en backend.</small>
      <div id="error"></div>
    </section>
  `);

  app.querySelectorAll<HTMLButtonElement>("button[data-provider]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await login(btn.dataset.provider as "google" | "apple" | "github");
        const me = await getMe();
        if (!me.username) {
          showUsernameSetup();
          return;
        }
        showMenu();
      } catch (error) {
        const container = document.querySelector("#error");
        if (container) container.textContent = error instanceof Error ? error.message : "Error de autenticación";
      }
    };
  });
}

function showUsernameSetup() {
  clearMissionKeyHandler();
  setScreen(`
    <section class="screen">
      <h2>Elige tu USERNAME</h2>
      <input id="username" maxlength="16" placeholder="andres123" />
      <button id="saveUsername">Guardar</button>
      <div id="error"></div>
    </section>
  `);

  const button = app.querySelector<HTMLButtonElement>("#saveUsername");
  const input = app.querySelector<HTMLInputElement>("#username");
  if (!button || !input) return;

  button.onclick = async () => {
    try {
      await setUsername(input.value);
      showMenu();
    } catch (error) {
      const container = document.querySelector("#error");
      if (container) container.textContent = error instanceof Error ? error.message : "No se pudo guardar";
    }
  };
}

function showMenu() {
  clearMissionKeyHandler();
  setScreen(`
    <section class="screen">
      <h2>CENTRO DE CONTROL - ${GAME_TITLE}</h2>
      <nav class="menu">
        <button id="play">PLAY</button>
        <button id="missions">MISSIONS</button>
        <button id="profile">PROFILE</button>
        <button id="settings">SETTINGS</button>
        <button class="secondary" id="logout">EXIT / LOGOUT</button>
      </nav>
      <div id="panel"></div>
    </section>
  `);

  app.querySelector<HTMLButtonElement>("#play")!.onclick = () => showMissions(true);
  app.querySelector<HTMLButtonElement>("#missions")!.onclick = () => showMissions(false);
  app.querySelector<HTMLButtonElement>("#profile")!.onclick = async () => {
    const me = await getMe();
    const panel = app.querySelector("#panel");
    if (!panel) return;
    panel.innerHTML = `
      <div class="card">
        <h3>Perfil</h3>
        <p>Username: ${me.username}</p>
        <p>Fecha de creación: ${new Date(me.created_at).toLocaleString()}</p>
        <p>Misiones completadas: ${me.statistics.missions_completed}</p>
        <p>Muestras recolectadas: ${me.statistics.samples_collected}</p>
        <p>Distancia recorrida: ${me.statistics.distance_traveled}</p>
        <p>Tiempo jugado: ${me.statistics.time_played}</p>
      </div>
    `;
  };
  app.querySelector<HTMLButtonElement>("#settings")!.onclick = () => {
    const panel = app.querySelector("#panel");
    if (!panel) return;
    panel.innerHTML = `<div class="card"><h3>Settings</h3><p>Versión ${GAME_VERSION}</p></div>`;
  };
  app.querySelector<HTMLButtonElement>("#logout")!.onclick = async () => {
    await logout();
    showLogin();
  };
}

async function showMissions(autoStart: boolean) {
  clearMissionKeyHandler();
  const missions = normalizeMissionCards(await getMissions());
  let index = 0;

  const render = () => {
    const m = missions[index];
    setScreen(`
      <section class="screen">
        <h2>MISSION CAROUSEL</h2>
        <div class="carousel">
          <button id="prev" class="secondary">◀</button>
          <article class="card ${m.status === "LOCKED" ? "locked" : ""}">
            <h3>${m.code}</h3>
            <h4>${m.title}</h4>
            <p style="font-size:2rem">${m.icon}</p>
            <p>${m.description}</p>
            <p>STATUS: ${m.status}</p>
            <button id="start">INICIAR MISIÓN</button>
            <div id="lockMessage"></div>
          </article>
          <button id="next" class="secondary">▶</button>
        </div>
        <button id="back" class="secondary">Volver</button>
      </section>
    `);

    app.querySelector<HTMLButtonElement>("#prev")!.onclick = () => {
      index = (index + missions.length - 1) % missions.length;
      render();
    };
    app.querySelector<HTMLButtonElement>("#next")!.onclick = () => {
      index = (index + 1) % missions.length;
      render();
    };
    app.querySelector<HTMLButtonElement>("#back")!.onclick = () => {
      clearMissionKeyHandler();
      showMenu();
    };
    app.querySelector<HTMLButtonElement>("#start")!.onclick = () => {
      clearMissionKeyHandler();
      startMission(m);
    };

    if (autoStart && m.id === 1 && m.status !== "LOCKED") {
      clearMissionKeyHandler();
      startMission(m);
    }
  };

  missionKeyHandler = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      index = (index + missions.length - 1) % missions.length;
      render();
    }
    if (event.key === "ArrowRight") {
      index = (index + 1) % missions.length;
      render();
    }
  };

  window.addEventListener("keydown", missionKeyHandler, { once: false });
  render();
}

async function startMission(mission: { id: number; status: string }) {
  if (mission.status === "LOCKED") {
    const lockMessage = document.querySelector("#lockMessage");
    if (lockMessage) lockMessage.textContent = "MISSION LOCKED: Complete Mission 01 to unlock this mission.";
    return;
  }
  if (mission.id !== 1) {
    setScreen(`<section class="screen"><h2>Esta misión estará disponible en la siguiente iteración del MVP.</h2><button id="back">Volver</button></section>`);
    app.querySelector<HTMLButtonElement>("#back")!.onclick = showMenu;
    return;
  }

  setScreen(`<canvas id="renderCanvas"></canvas><aside class="overlay" id="hud"></aside>`);
  const canvas = app.querySelector<HTMLCanvasElement>("#renderCanvas");
  const hud = app.querySelector<HTMLDivElement>("#hud")!;
  if (!canvas) return;

  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  scene.clearColor = new Color3(0.03, 0.04, 0.08).toColor4();

  const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 35, new Vector3(0, 5, 0), scene);
  camera.attachControl(canvas, true);

  const light = new HemisphericLight("light", new Vector3(0.3, 1, 0), scene);
  light.intensity = 0.95;

  const ground = MeshBuilder.CreateGround("ground", { width: 80, height: 80, subdivisions: 2 }, scene);
  const groundMat = new StandardMaterial("ground-mat", scene);
  groundMat.diffuseColor = new Color3(0.18, 0.18, 0.2);
  ground.material = groundMat;

  const astronaut = createAstronaut(scene, "early");
  astronaut.position = new Vector3(-4, 1.2, 0);

  const rocket = createRocket(scene, "mission-1");
  rocket.position = new Vector3(0, 3.7, 0);

  const world = new RAPIER.World({ x: 0, y: -PHYSICS_SETTINGS.EARTH_GRAVITY, z: 0 });
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 3.7, 0));

  const resources: ResourceState = {
    budget: 100,
    mass: 75,
    fuel: 100,
    energy: 100,
    communication: 100,
    time: 0,
    scienceCapacity: 50
  };

  let countdown = 10;
  let launched = false;
  let countdownTimer: number | undefined;
  let missionCompleted = false;

  const resizeHandler = () => engine.resize();

  const cleanupMission = () => {
    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = undefined;
    }
    window.removeEventListener("resize", resizeHandler);
    engine.stopRenderLoop();
    engine.dispose();
  };

  function renderHud() {
    hud.innerHTML = `
      <h3>MISSION 01 — THE BEGINNING</h3>
      <p>BUDGET: ${resources.budget}</p>
      <p>MASS: ${resources.mass}</p>
      <p>FUEL: ${resources.fuel.toFixed(1)}</p>
      <p>ENERGY: ${resources.energy.toFixed(1)}</p>
      <p>COMMUNICATION: ${resources.communication.toFixed(1)}</p>
      <p>SCIENCE CAPACITY: ${resources.scienceCapacity}</p>
      <p>TIME: ${resources.time}s</p>
      <p>COUNTDOWN: ${countdown}</p>
      <button id="launchBtn">${launched ? "LANZADO" : "INICIAR CUENTA REGRESIVA"}</button>
      <button id="exitBtn" class="secondary">SALIR</button>
      <div id="result"></div>
    `;

    hud.querySelector<HTMLButtonElement>("#launchBtn")!.onclick = () => {
      if (launched || countdownTimer) return;
      countdownTimer = window.setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          window.clearInterval(countdownTimer);
          countdownTimer = undefined;
          launched = true;
          body.applyImpulse({ x: 0, y: 140, z: 0 }, true);
        }
        renderHud();
      }, 1000);
    };
    hud.querySelector<HTMLButtonElement>("#exitBtn")!.onclick = () => {
      cleanupMission();
      showMenu();
    };
  }

  renderHud();

  await saveProgress({ mission_id: 1, status: "in_progress", resources });

  engine.runRenderLoop(async () => {
    world.step();
    const position = body.translation();
    rocket.position.y = position.y;

    if (launched) {
      resources.time += 1 / 60;
      resources.fuel = Math.max(0, resources.fuel - 0.1);
      resources.energy = Math.max(0, resources.energy - 0.03);
      resources.communication = Math.max(0, resources.communication - 0.02);
      if (Math.round(resources.time) % 2 === 0) {
        renderHud();
      }
    }

    if (!missionCompleted && launched && position.y > 40) {
      missionCompleted = true;
      launched = false;
      await completeMission(1);
      await saveProgress({ mission_id: 1, status: "completed", resources });
      const result = document.querySelector("#result");
      if (result) result.textContent = "RESULTADO: MISIÓN COMPLETADA. Mission 02 desbloqueada.";
    }

    scene.render();
  });

  window.addEventListener("resize", resizeHandler);
}

init();
