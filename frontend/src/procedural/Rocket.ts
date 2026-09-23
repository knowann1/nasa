import { Color3, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";

export function createRocket(scene: Scene, configuration = "mission-1"): TransformNode {
  const root = new TransformNode(`rocket-${configuration}`, scene);

  const white = new StandardMaterial("rocket-white", scene);
  white.diffuseColor = new Color3(0.95, 0.95, 0.97);

  const dark = new StandardMaterial("rocket-dark", scene);
  dark.diffuseColor = new Color3(0.2, 0.2, 0.25);

  const body = MeshBuilder.CreateCylinder("rocket-body", { diameter: 1.0, height: 6.5 }, scene);
  body.material = white;
  body.parent = root;

  const nose = MeshBuilder.CreateCylinder("rocket-nose", { diameterTop: 0, diameterBottom: 1, height: 1.7 }, scene);
  nose.position.y = 4.1;
  nose.material = white;
  nose.parent = root;

  for (const x of [-0.35, 0.35]) {
    const fin = MeshBuilder.CreateBox(`fin-${x}`, { width: 0.1, height: 0.9, depth: 0.6 }, scene);
    fin.position = new Vector3(x, -3, 0);
    fin.material = dark;
    fin.parent = root;
  }

  const engine = MeshBuilder.CreateCylinder("rocket-engine", { diameterTop: 0.4, diameterBottom: 0.55, height: 0.6 }, scene);
  engine.position.y = -3.55;
  engine.material = dark;
  engine.parent = root;

  return root;
}
