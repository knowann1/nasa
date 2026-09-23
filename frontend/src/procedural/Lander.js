import { MeshBuilder, TransformNode } from "@babylonjs/core";
export function createLander(scene) {
    const root = new TransformNode("lander", scene);
    MeshBuilder.CreateCylinder("lander-body", { diameter: 2, height: 1.5 }, scene).parent = root;
    return root;
}
