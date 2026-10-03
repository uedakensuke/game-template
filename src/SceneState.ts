import { Application, Container, Graphics } from "pixi.js";

export type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

export type LIMIT_Y_HANDLE = "ground" | "hole";

export type GamePad = {
  l_stick_x: number;
  l_stick_y: number;
  btn_a: boolean;
  btn_b: boolean;
  btn_x: boolean;
  btn_y: boolean;
};

export type Vec2D = {
  x: number;
  y: number;
};
export type Size2D = {
  w: number;
  h: number;
};

export type CollidType = "take" | "stop" | "pass";

export type ObjectSetting = {
  draw: (g: Graphics, tileSize: number) => void;
  collid: CollidType;
  collidRatio?: number; // Unitに対してのみ有効
  initialPosition: Vec2D;
};

export type SceneSetting = {
  gravity: number; //1秒当たりのy方向速度変化
  max_v: Vec2D; //最大速度
  limit_y: LIMIT_Y_HANDLE;
  unitSettings: Record<string, ObjectSetting>;
  fixedObjectSettings: Record<string, ObjectSetting>;
  mapSize: Size2D;
  initialSelectedUnitId: string;
  initialFocus: Vec2D;
  handleGamePad: (app: Application, pad: GamePad, dt?: number) => void;
  handleArrowKey: (app: Application, keys: Set<ArrowKey>, dt?: number) => void;
  handleWheel: (app: Application, deltaY: number) => void;
};

export class SceneState {
  gravity: number = 0; //1秒当たりのy方向速度変化
  max_v: Vec2D = { x: 5.0, y: 5.0 }; //最大速度
  limit_y: LIMIT_Y_HANDLE = "ground";
  tileSize: number = 50;
  mapSize: Size2D = { w: 1, h: 1 };
  units: Record<string, UnitState> = {};
  fixedObjects: Record<number, ObjectState> = {};
  selectedUnitId: string = "";
  mapGraphics = new Graphics();
  cameraContainer = new Container();
  sceneFocus: Vec2D = { x: 0, y: 0 };
  handleGamePad: (app: Application, pad: GamePad, dt?: number) => void =
    () => {};
  handleArrowKey: (app: Application, keys: Set<ArrowKey>, dt?: number) => void =
    () => {};
  handleWheel: (app: Application, deltaY: number) => void = () => {};

  set(app: Application, setting: SceneSetting) {
    for (const unitId in this.units) {
      const unit = this.units[unitId];
      unit.destroy();
    }
    for (const posIndex in this.fixedObjects) {
      const object = this.fixedObjects[posIndex];
      object.destroy();
    }

    this.gravity = setting.gravity;
    this.max_v = setting.max_v;
    this.limit_y = setting.limit_y;
    this.mapSize = setting.mapSize;
    this.selectedUnitId = setting.initialSelectedUnitId;
    this.sceneFocus = setting.initialFocus;
    this.handleGamePad = setting.handleGamePad;
    this.handleArrowKey = setting.handleArrowKey;
    this.handleWheel = setting.handleWheel;

    const camera = this.cameraContainer;
    camera.removeChildren();
    camera.addChild(this.mapGraphics);
    this.mapGraphics.clear();
    this.drawGrid(this.mapGraphics, this.tileSize);

    //unitsの初期化
    this.units = {};
    for (const unitId in setting.unitSettings) {
      this.units[unitId] = new UnitState(
        this,
        unitId,
        setting.unitSettings[unitId],
      );
      camera.addChild(this.units[unitId].graphics);
    }

    //fixedObjectsの初期化
    this.fixedObjects = {};
    for (const objId in setting.fixedObjectSettings) {
      const objSetting = setting.fixedObjectSettings[objId];
      const obj = new ObjectState(this, objId, objSetting);

      this.setFixedObject(
        objSetting.initialPosition.x,
        objSetting.initialPosition.y,
        obj,
      );
      camera.addChild(obj.graphics);
    }
    this.updateCameraPosition(app.screen.width, app.screen.height);
  }

  getFixedObject(x_int: number, y_int: number): ObjectState | undefined {
    /**
     * x,yは整数
     */
    const posIndex = x_int + y_int * this.mapSize.w;
    return this.fixedObjects[posIndex];
  }
  checkFixedObjectCollid(x_int: number, y_int: number): boolean {
    /**
     * x,yは整数
     */
    const obj = this.getFixedObject(x_int, y_int);
    return obj !== undefined && obj.setting.collid == "stop";
  }
  setFixedObject(x_int: number, y_int: number, obj: ObjectState) {
    /**
     * x,yは整数
     */
    const posIndex = x_int + y_int * this.mapSize.w;
    return (this.fixedObjects[posIndex] = obj);
  }

  updateCameraPosition = (screenWidth: number, screenHeight: number) => {
    /***
     * カメラ位置を更新する
     */
    const camera = this.cameraContainer;
    camera.x = screenWidth / 2 - (this.sceneFocus.x + 0.5) * this.tileSize;
    camera.y = screenHeight / 2 - (this.sceneFocus.y + 0.5) * this.tileSize;
  };
  applyPhysicsToAllUnits(dt: number) {
    for (const unitId in this.units) {
      this.units[unitId].applyPhysics(dt);
      //this.units[unitId].snapX();
    }
  }
  checkUnitOnGround() {
    return this.units[this.selectedUnitId].checkNearGround();
  }
  getActiveUnit() {
    return this.units[this.selectedUnitId];
  }
  redrawAll() {
    this.mapGraphics.clear();
    this.drawGrid(this.mapGraphics, this.tileSize);
    for (const unitId in this.units) {
      this.units[unitId].redraw();
    }
    for (const posIndex in this.fixedObjects) {
      this.fixedObjects[posIndex].redraw();
    }
  }
  drawGrid = (graphics: Graphics, tileSize: number) => {
    /***
     * grid線を世界座標系で描画する。
     * 世界座標系とは、mapの[0,0]マスの左上隅を原点とする。
     * - mapは世界座標系上の下記範囲に存在
     *   - スクエアグリッドの場合：(0,0)--(mapSize.w*tileSize,mapSize.h*tileSize)
     *   - ヘックスグリッドの場合：(0,0)--((mapSize.w+0.5)*tileSize,mapSize.h*tileSize)
     */

    graphics.clear();

    for (let x = 0; x <= this.mapSize.w; x++) {
      graphics.moveTo(x * tileSize, 0);
      graphics.lineTo(x * tileSize, this.mapSize.h * tileSize);
    }

    for (let y = 0; y <= this.mapSize.h; y++) {
      graphics.moveTo(0, y * tileSize);
      graphics.lineTo(this.mapSize.w * tileSize, y * tileSize);
    }

    graphics.stroke({
      width: 1,
      color: 0x666666,
    });
  };
}

export class ObjectState {
  scene: SceneState;
  objId: string;
  position: Vec2D = { x: 0, y: 0 };
  setting: ObjectSetting;
  graphics: Graphics;
  constructor(scene: SceneState, objId: string, setting: ObjectSetting) {
    this.scene = scene;
    this.objId = objId;
    this.position.x = setting.initialPosition.x;
    this.position.y = setting.initialPosition.y;
    this.setting = setting;
    this.graphics = new Graphics();
    this.redraw();
  }
  destroy() {
    this.graphics.destroy();
  }
  redraw() {
    const tileSize = this.scene.tileSize;
    this.applyPosToGraphics();
    this.setting.draw(this.graphics, tileSize);
  }
  applyPosToGraphics() {
    const tileSize = this.scene.tileSize;
    this.graphics.x = (this.position.x + 0.5) * tileSize;
    this.graphics.y = (this.position.y + 0.5) * tileSize;
  }
}

export class UnitState extends ObjectState {
  v: Vec2D = { x: 0, y: 0 };
  max_v_ratio: Vec2D = { x: 1, y: 1 };
  collidRatio: number = 1.0;

  constructor(scene: SceneState, objId: string, setting: ObjectSetting) {
    super(scene, objId, setting);
    this.collidRatio = setting.collidRatio ? setting.collidRatio : 1.0;
  }
  checkCollidX(x_int: number, y_float: number): boolean {
    /**
     * x方向にぶつかるか確認する。xは整数,yは小数
     */
    const DELTA = 0.0001;
    return (
      this.scene.checkFixedObjectCollid(
        x_int,
        Math.round(y_float - this.collidRatio / 2 + DELTA),
      ) ||
      this.scene.checkFixedObjectCollid(
        x_int,
        Math.round(y_float + this.collidRatio / 2 - DELTA),
      ) ||
      x_int == this.scene.mapSize.w ||
      x_int == -1
    );
  }
  checkCollidY(x_float: number, y_int: number): boolean {
    /**
     * y方向にぶつかるか確認する。xは小数,yは整数
     */
    const DELTA = 0.0001;
    return (
      this.scene.checkFixedObjectCollid(
        Math.round(x_float - this.collidRatio / 2 + DELTA),
        y_int,
      ) ||
      this.scene.checkFixedObjectCollid(
        Math.round(x_float + this.collidRatio / 2 - DELTA),
        y_int,
      ) ||
      (this.scene.limit_y == "ground" &&
        (y_int == this.scene.mapSize.h || y_int == -1))
    );
  }

  checkNearGround(near_thresh = 0.1) {
    const round_y = Math.round(this.position.y);
    const rim_y = this.position.y + this.collidRatio / 2;
    const y_is_downward = round_y + 0.5 - rim_y <= near_thresh;
    return y_is_downward && this.checkCollidY(this.position.x, round_y + 1);
  }
  checkNearLeftWall(near_thresh = 0.01) {
    const round_x = Math.round(this.position.x);
    const rim_x = this.position.x - this.collidRatio / 2;
    const x_is_leftside = rim_x - (round_x - 0.5) <= near_thresh;
    return x_is_leftside && this.checkCollidX(round_x - 1, this.position.y);
  }
  checkNearRightWall(near_thresh = 0.01) {
    const round_x = Math.round(this.position.x);
    const rim_x = this.position.x + this.collidRatio / 2;
    const x_is_rightside = round_x + 0.5 - rim_x <= near_thresh;
    return x_is_rightside && this.checkCollidX(round_x + 1, this.position.y);
  }

  move(dx: number, dy: number) {
    if (this.scene.limit_y == "ground") {
      this.position.x = Math.min(
        Math.max(0, this.position.x + dx),
        sceneState.mapSize.w - 1,
      );
    } else if (this.scene.limit_y == "hole") {
      this.position.x += dx;
    }
    this.position.y = Math.min(
      Math.max(0, this.position.y + dy),
      sceneState.mapSize.h - 1,
    );
    this.redraw();
  }
  accel(dvx: number, dvy: number) {
    const MAX_ACCEL = 10;
    this.setSpeed(
      this.v.x + Math.min(Math.max(-MAX_ACCEL, dvx), MAX_ACCEL),
      this.v.y + Math.min(Math.max(-MAX_ACCEL, dvy), MAX_ACCEL),
    );
  }
  setSpeed(vx?: number, vy?: number) {
    const max_v_x = this.scene.max_v.x * this.max_v_ratio.x;
    const max_v_y = this.scene.max_v.y * this.max_v_ratio.y;
    if (vx !== undefined) this.v.x = Math.min(Math.max(-max_v_x, vx), max_v_x);
    if (vy !== undefined) this.v.y = Math.min(Math.max(-max_v_y, vy), max_v_y);
  }
  setMaxSpeedRatio(x?: number, y?: number) {
    if (x !== undefined) this.max_v_ratio.x = x;
    if (y !== undefined) this.max_v_ratio.y = y;
  }
  snapX(mergin = 0.1) {
    const x_int = Math.round(this.position.x);
    if (this.v.x == 0 && Math.abs(x_int - this.position.x) < mergin) {
      this.position.x = x_int;
    }
  }
  calcColidXDt(dt: number): number | undefined {
    /**
     * 現在の速度でdt進む間にx方向に衝突するかチェックする。
     * dtには、現在の速度で進む距離が1以下になる値を与えること。
     * 衝突する場合、衝突するまでの時間を返す。
     * 衝突しない場合、undefinedを返す。
     */
    const LIMIT = 0.99; //めり込まないように抑える
    const DELTA = 0.00001; //境界チェックを緩める
    if (this.v.x == 0) return;

    const sign = Math.sign(this.v.x);
    const x_rim = this.position.x + (sign * this.collidRatio) / 2;
    const x_adjacent_tile = Math.round(this.position.x) + sign * 0.5;
    const x_rim_future = x_rim + this.v.x * dt;
    if (Math.round(x_rim - sign * DELTA) != Math.round(x_rim_future)) {
      if (this.checkCollidX(Math.round(x_rim_future), this.position.y)) {
        const collid_dt = (x_adjacent_tile - x_rim) / this.v.x;
        if (collid_dt <= dt) {
          console.assert(collid_dt >= 0);
          return collid_dt * LIMIT;
        }
      }
    }
    return;
  }
  calcColidYDt(dt: number): number | undefined {
    /**
     * 現在の速度でdt進む間にy方向に衝突するかチェックする。
     * dtには、現在の速度で進む距離が1以下になる値を与えること。
     * 衝突する場合、衝突するまでの時間を返す。
     * 衝突しない場合、undefinedを返す。
     */
    const LIMIT = 0.99; //めり込まないように抑える
    const DELTA = 0.00001; //境界チェックを緩める
    if (this.v.y == 0) return;

    const sign = Math.sign(this.v.y);
    const y_rim = this.position.y + (sign * this.collidRatio) / 2;
    const y_adjacent_tile = Math.round(this.position.y) + sign * 0.5;
    const y_rim_future = y_rim + this.v.y * dt;
    if (Math.round(y_rim - sign * DELTA) != Math.round(y_rim_future)) {
      if (this.checkCollidY(this.position.x, Math.round(y_rim_future))) {
        const collid_dt = (y_adjacent_tile - y_rim) / this.v.y;
        if (collid_dt <= dt) {
          console.assert(collid_dt >= 0);
          return collid_dt * LIMIT;
        }
      }
    }
    return;
  }
  applyPhysics(dt: number) {
    // 重力加速度の適用
    if (!this.checkNearGround()) {
      this.accel(0, sceneState.gravity * dt);
    }

    // 速度の適用
    const abs_speed = Math.max(Math.abs(this.v.x), Math.abs(this.v.y));
    const l = abs_speed * dt;
    const num_steps = Math.ceil(l);
    for (let i = 0; i < num_steps; i++) {
      const dl = l - i >= 1 ? 1 : l - i;
      const _dt = dl / abs_speed;

      const collid_x_dt = this.calcColidXDt(_dt);
      const collid_y_dt = this.calcColidYDt(_dt);

      if (collid_x_dt !== undefined) {
        const sign_x = Math.sign(this.v.x);
        this.v.x = 0;
        this.position.x =
          Math.round(this.position.x) + (sign_x * (1 - this.collidRatio)) / 2;
        console.log("colid x", this.position.x, this.position.y);
      } else {
        this.position.x += this.v.x * _dt;
      }
      if (collid_y_dt !== undefined) {
        const sign_y = Math.sign(this.v.y);
        this.v.y = 0;
        this.position.y =
          Math.round(this.position.y) + (sign_y * (1 - this.collidRatio)) / 2;
        console.log("colid y", this.position.x, this.position.y);
      } else {
        this.position.y += this.v.y * _dt;
      }

      if (this.v.x == 0 && this.v.y == 0) break;
    }

    //横方向の減速
    const BREAK = 2; //1秒あたりの減速
    if (this.v.x > 0) {
      this.v.x = Math.max(0, this.v.x - BREAK * dt);
    } else if (this.v.x < 0) {
      this.v.x = Math.min(0, this.v.x + BREAK * dt);
    }

    if (this.v.x != 0 || this.v.y != 0) {
      console.log("phsics", this.objId, this.position.x, this.position.y);
    }
    this.applyPosToGraphics();
  }
}

export const sceneState = new SceneState();
