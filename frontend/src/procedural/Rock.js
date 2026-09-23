import { MeshBuilder } from "@babylonjs/core";
export function createRock(scene, type = "basalt") {
    return MeshBuilder.CreateSphere(`rock-${type}`, { diameterX: 0.9, diameterY: 0.6, diameterZ: 0.75 }, scene);
}
