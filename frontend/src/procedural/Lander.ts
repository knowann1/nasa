import { MeshBuilder, Scene, TransformNode } from "@babylonjs/core";

export function createLander(scene: Scene): TransformNode {
  const root = new TransformNode("lander", scene);
  MeshBuilder.CreateCylinder("lander-body", { diameter: 2, height: 1.5 }, scene).parent = root;
  return root;
}
