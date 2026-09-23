import { MeshBuilder } from "@babylonjs/core";
export function createLunarTerrain(scene) {
    const ground = MeshBuilder.CreateGround("lunar-terrain", { width: 80, height: 80, subdivisions: 40 }, scene);
    const positions = ground.getVerticesData("position");
    if (positions) {
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            positions[i + 1] = Math.sin(x * 0.12) * 0.6 + Math.cos(z * 0.08) * 0.4;
        }
        ground.updateVerticesData("position", positions);
        ground.refreshBoundingInfo();
    }
    return ground;
}
