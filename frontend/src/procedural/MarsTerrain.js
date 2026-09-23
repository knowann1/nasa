import { MeshBuilder } from "@babylonjs/core";
export function createMarsTerrain(scene) {
    const ground = MeshBuilder.CreateGround("mars-terrain", { width: 100, height: 100, subdivisions: 50 }, scene);
    return ground;
}
