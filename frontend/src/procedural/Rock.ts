import { MeshBuilder, Scene } from "@babylonjs/core";

export function createRock(scene: Scene, type = "basalt") {
  return MeshBuilder.CreateSphere(`rock-${type}`, { diameterX: 0.9, diameterY: 0.6, diameterZ: 0.75 }, scene);
}
