type PhysicsBody = {
  getPosition(): { x: number; y: number; z: number };
  getQuaternion(): { x: number; y: number; z: number; w: number };
  remove(): void;
};

export class World {
  constructor(options?: Record<string, unknown>);
  add(options: Record<string, unknown>): PhysicsBody;
  step(): void;
  clear(): void;
}
