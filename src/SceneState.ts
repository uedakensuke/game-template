import { Application, Container, Graphics } from "pixi.js";

const DEBUG_LOG = false;

export type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

export type LIMIT_Y_HANDLE = "collid" | "pass";

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

export type OverlapType =
  | "take"
  | "collid"
  | "collid_from_upper"
  | "collid_from_lower"
  | "collid_from_left"
  | "collid_from_right"
  | "pass";

export type ObjectSetting = {
  draw: (g: Graphics, tileSize: number) => void;
  overlap: OverlapType;
  physicalSize?: number; // overlap判定を行う大きさ。Unitに対してのみ有効
  initialPosition: Vec2D;
};

export type SceneSettingOptional = {
  throttle_ratio: number; //1より小さい値で時間経過が遅くなる。1より大きい値で時間経過が速くなる。指定しない場合1。
  gravity: number; //1秒当たりのy方向速度変化。単位は[マス/sec^2]。指定しない場合0。
  initialSelectedUnitId: string;
  initialFocus: Vec2D;
  limit_y: LIMIT_Y_HANDLE;
};

export type SceneSetting = Partial<SceneSettingOptional> & {
  max_v: Vec2D; //最大速度。単位は[マス/sec]
  unitSettings: Record<string, ObjectSetting>;
  fixedObjectSettings: Record<string, ObjectSetting>;
  mapSize: Size2D;
  handleGamePad: (app: Application, pad: GamePad, dt?: number) => void;
  handleArrowKey: (app: Application, keys: Set<ArrowKey>, dt?: number) => void;
  handleWheel: (app: Application, deltaY: number) => void;
};

export class SceneState {
  throttle_ratio: number = 1.0; //1より小さい値で時間経過が遅くなる。1より大きい値で時間経過が速くなる。
  gravity: number = 0; //1秒当たりのy方向速度変化。単位は[マス/sec^2]。
  selectedUnitId: string = "";
  limit_y: LIMIT_Y_HANDLE = "collid";
  sceneFocus: Vec2D = { x: 0, y: 0 };

  max_v: Vec2D = { x: 5.0, y: 5.0 }; //最大速度。単位は[マス/sec]
  tileSize: number = 50;
  mapSize: Size2D = { w: 1, h: 1 };
  units: Record<string, UnitState> = {};
  fixedObjects: Record<number, ObjectState> = {};
  mapGraphics = new Graphics();
  cameraContainer = new Container();
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
    if (setting.throttle_ratio !== undefined)
      this.throttle_ratio = setting.throttle_ratio;
    if (setting.gravity !== undefined) this.gravity = setting.gravity;
    if (setting.limit_y !== undefined) this.limit_y = setting.limit_y;
    if (setting.initialSelectedUnitId !== undefined)
      this.selectedUnitId = setting.initialSelectedUnitId;
    this.sceneFocus =
      setting.initialFocus !== undefined
        ? setting.initialFocus
        : {
            x: setting.mapSize.w / 2,
            y: setting.mapSize.h / 2,
          };

    this.max_v = setting.max_v;
    this.mapSize = setting.mapSize;
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
  setFocusXToActiveUnit(app: Application) {
    const unit = this.getActiveUnit();
    if (unit === undefined) {
      return;
    }

    if (app.screen.width >= this.tileSize * this.mapSize.w) {
      return;
    }
    const min_focus_x = app.screen.width / this.tileSize / 2 - 0.5;
    const max_focus_x =
      this.mapSize.w - app.screen.width / this.tileSize / 2 - 0.5;
    this.sceneFocus.x = Math.max(
      min_focus_x,
      Math.min(unit.position.x, max_focus_x),
    );
    this.updateCameraPosition(app.screen.width, app.screen.height);
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

function roundInner(val: number, baseVal: number) {
  /**
   * 境界上(端数が0.5)の場合、baseValに近い方に丸める
   * roundInner(2.5,1.0)===2.0
   * roundInner(2.5,10.0)===3.0
   */
  let round_val = Math.round(val);
  const shift = val > baseVal ? -1 : 0;
  return round_val - val === 0.5 ? round_val + shift : round_val;
}

export class UnitState extends ObjectState {
  v: Vec2D = { x: 0, y: 0 };
  max_v_ratio: Vec2D = { x: 1, y: 1 };
  physicalSize: number = 1.0;
  secPreventGravity: number = 0.02;
  secInAir: number = 0.0;

  constructor(scene: SceneState, objId: string, setting: ObjectSetting) {
    super(scene, objId, setting);
    this.physicalSize = setting.physicalSize ? setting.physicalSize : 1.0;
  }
  isCollidObject(x: number, y: number): boolean {
    /**
     * 指定点（x,yは小数）がcollidなオブジェクト内に存在するか判定する
     */
    let round_x = roundInner(x, this.position.x); //ピッタリ接触している場合、衝突してないとする
    let round_y = roundInner(y, this.position.y); //ピッタリ接触している場合、衝突してないとする

    if (round_x >= this.scene.mapSize.w || round_x <= -1) {
      return true;
    }
    if (
      this.scene.limit_y == "collid" &&
      (round_y == this.scene.mapSize.h || round_y == -1)
    )
      return true;

    const obj = this.scene.getFixedObject(round_x, round_y);
    if (obj === undefined) return false;
    switch (obj.setting.overlap) {
      case "collid":
        return true;
      case "collid_from_upper":
        return this.position.y + this.physicalSize / 2 <= round_y - 0.5;
      case "collid_from_lower":
        return this.position.y - this.physicalSize / 2 >= round_y + 0.5;
      case "collid_from_left":
        return this.position.x + this.physicalSize / 2 <= round_x - 0.5;
      case "collid_from_right":
        return this.position.x - this.physicalSize / 2 >= round_x + 0.5;
      default:
        return false;
    }
  }

  isInCollidObject(): boolean {
    /**
     * オブジェクトは必ずユニットより大きいとの前提のもとで
     * ユニットが通過不能オブジェクトの中にいるか判定する
     */
    const x = this.position.x;
    const y = this.position.y;
    const d = this.physicalSize / 2;
    return (
      this.isCollidObject(x - d, y - d) ||
      this.isCollidObject(x - d, y + d) ||
      this.isCollidObject(x + d, y - d) ||
      this.isCollidObject(x + d, y + d)
    );
  }
  calcCollidTime(dt: number): Partial<Vec2D> {
    /**
     * このユニットがdt時間動こうとするときに衝突するまでの時間を計算する。
     * ※オブジェクトのサイズ（==1）よりユニットのサイズが小さいことを前提とし３点チェックで計算する
     */
    if (this.v.x == 0 && this.v.y == 0) {
      return { x: undefined, y: undefined };
    }

    const collid_dt_list = [];
    if (this.v.x == 0) {
      const sign_y = Math.sign(this.v.y);
      const front_y = this.position.y + (sign_y * this.physicalSize) / 2;
      const left_x = this.position.x - this.physicalSize / 2;
      const right_x = this.position.x + this.physicalSize / 2;
      collid_dt_list.push(this.calcMovingPointCollidTime(left_x, front_y, dt));
      collid_dt_list.push(this.calcMovingPointCollidTime(right_x, front_y, dt));
    } else if (this.v.y == 0) {
      const sign_x = Math.sign(this.v.x);
      const front_x = this.position.x + (sign_x * this.physicalSize) / 2;
      const upper_y = this.position.y - this.physicalSize / 2;
      const lower_y = this.position.y + this.physicalSize / 2;
      collid_dt_list.push(this.calcMovingPointCollidTime(front_x, upper_y, dt));
      collid_dt_list.push(this.calcMovingPointCollidTime(front_x, lower_y, dt));
    } else {
      const sign_x = Math.sign(this.v.x);
      const sign_y = Math.sign(this.v.y);

      const front_x = this.position.x + (sign_x * this.physicalSize) / 2;
      const front_y = this.position.y + (sign_y * this.physicalSize) / 2;
      const rear_x = this.position.x - (sign_x * this.physicalSize) / 2;
      const rear_y = this.position.y - (sign_y * this.physicalSize) / 2;

      collid_dt_list.push(this.calcMovingPointCollidTime(rear_x, front_y, dt));
      collid_dt_list.push(this.calcMovingPointCollidTime(front_x, rear_y, dt));
      collid_dt_list.push(this.calcMovingPointCollidTime(front_x, front_y, dt));
    }

    let collid_x_dt;
    let collid_y_dt;

    for (const collid_dt of collid_dt_list) {
      if (collid_dt.x !== undefined) {
        collid_x_dt =
          collid_x_dt === undefined
            ? collid_dt.x
            : Math.min(collid_dt.x, collid_x_dt);
      }
      if (collid_dt.y !== undefined) {
        collid_y_dt =
          collid_y_dt === undefined
            ? collid_dt.y
            : Math.min(collid_dt.y, collid_y_dt);
      }
    }
    return {
      x: collid_x_dt,
      y: collid_y_dt,
    };
  }
  calcMovingPointCollidTime(x: number, y: number, dt: number): Partial<Vec2D> {
    /**
     * 指定の点x,yが最大dt時間動こうとするときに衝突するまでの時間を計算する。
     * ※この動きの変化dx,dyは1以下であることを前提とし、x境界,y境界はそれぞれたかだか１回しか超えない
     *
     * 指定の点x,yは現在位置position.x,position.yより現在速度v側にある点を指定すること
     *
     * 既にめり込んでいる場合は、衝突として扱わない
     *
     * x,y両方向とも衝突しない場合は、{ x: undefined, y: undefined }を返す
     * x方向に先に衝突する場合は、{ x: collid_x_dt, y: undefined }を返す
     * y方向に先に衝突する場合は、{ x: undefined, y: collid_y_dt }を返す
     * xy方向に同時衝突する場合は、{ x: collid_dt, y: collid_dt }を返す
     */

    if (this.v.x == 0 && this.v.y == 0) {
      return { x: undefined, y: undefined };
    } else if (this.v.x == 0) {
      const sign_y = Math.sign(this.v.y);
      const boundary_y = roundInner(y, this.position.y) + sign_y * 0.5;
      const trans_y_dt = (boundary_y - y) / this.v.y; //y境界を超えるまでの時間
      if (trans_y_dt < dt && this.isCollidObject(x, y + sign_y)) {
        return { y: trans_y_dt };
      }
    } else if (this.v.y == 0) {
      const sign_x = Math.sign(this.v.x);
      const boundary_x = roundInner(x, this.position.x) + sign_x * 0.5;
      const trans_x_dt = (boundary_x - x) / this.v.x; //x境界を超えるまでの時間
      if (trans_x_dt < dt && this.isCollidObject(x + sign_x, y)) {
        return { x: trans_x_dt };
      }
    } else {
      const sign_x = Math.sign(this.v.x);
      const sign_y = Math.sign(this.v.y);
      const boundary_x = roundInner(x, this.position.x) + sign_x * 0.5;
      const boundary_y = roundInner(y, this.position.y) + sign_y * 0.5;

      const trans_x_dt = (boundary_x - x) / this.v.x; //x境界を超えるまでの時間
      const trans_y_dt = (boundary_y - y) / this.v.y; //y境界を超えるまでの時間

      if (trans_x_dt == trans_y_dt) {
        const trans_dt = trans_x_dt;
        if (trans_dt < dt && this.isCollidObject(x + sign_x, y + sign_y)) {
          return { x: trans_dt, y: trans_dt };
        }
      } else if (trans_x_dt < trans_y_dt) {
        if (trans_x_dt < dt && this.isCollidObject(x + sign_x, y)) {
          return { x: trans_x_dt };
        }
        if (trans_y_dt < dt && this.isCollidObject(x + sign_x, y + sign_y)) {
          return { y: trans_y_dt };
        }
      } else if (trans_y_dt < trans_x_dt) {
        if (trans_y_dt < dt && this.isCollidObject(x, y + sign_y)) {
          return { y: trans_y_dt };
        }
        if (trans_x_dt < dt && this.isCollidObject(x + sign_x, y + sign_y)) {
          return { x: trans_x_dt };
        }
      }
    }
    return { x: undefined, y: undefined };
  }

  checkStaticCollidX(x: number): boolean {
    /**
     * 指定のx値における縦の線分(x,y-physicalSize / 2)--(x,y+physicalSize / 2)が衝突するか確認する。
     * ※この線分の長さは1以下であることを前提とし、２点チェックで判定している
     */
    return (
      this.isCollidObject(x, this.position.y - this.physicalSize / 2) ||
      this.isCollidObject(x, this.position.y + this.physicalSize / 2)
    );
  }
  checkStaticCollidY(y: number): boolean {
    /**
     * 指定のy値における横の線分(x-physicalSize / 2,y)--(x+physicalSize / 2,y)が衝突するか確認する
     * ※この線分の長さは1以下であることを前提とし、２点チェックで判定している
     */
    return (
      this.isCollidObject(this.position.x - this.physicalSize / 2, y) ||
      this.isCollidObject(this.position.x + this.physicalSize / 2, y)
    );
  }

  checkNearGround(near_thresh = 0.1) {
    return this.checkStaticCollidY(
      this.position.y + this.physicalSize / 2 + near_thresh,
    );
  }
  checkNearLeftWall(near_thresh = 0.01) {
    return this.checkStaticCollidX(
      this.position.x - this.physicalSize / 2 - near_thresh,
    );
  }
  checkNearRightWall(near_thresh = 0.01) {
    return this.checkStaticCollidX(
      this.position.x + this.physicalSize / 2 + near_thresh,
    );
  }

  move(dx: number, dy: number) {
    if (this.scene.limit_y == "collid") {
      this.position.x = Math.min(
        Math.max(0, this.position.x + dx),
        sceneState.mapSize.w - 1,
      );
    } else if (this.scene.limit_y == "pass") {
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
     * 衝突有無は、ユニットの左辺（v<0の場合）もしくは右辺（v>0の場合）が衝突するかで判定する
     * この判定では、x方向の現在速度のみ考慮し、y方向の速度は無視する
     * （xとy両方の速度持つ場合、calcColidXDtとcalcColidYDtでそれぞれ衝突しなくても斜めに衝突する可能性が残る）
     *
     * 衝突する場合、衝突するまでの時間を返す。
     * 衝突しない場合、undefinedを返す。
     */
    const LIMIT = 0.99; //めり込まないように抑える
    const DELTA = 0.00001; //境界チェックを緩める
    if (this.v.x == 0) return;

    const sign = Math.sign(this.v.x);
    const x_rim = this.position.x + (sign * this.physicalSize) / 2;
    const x_adjacent_tile = Math.round(this.position.x) + sign * 0.5;
    const x_rim_future = x_rim + this.v.x * dt;
    if (Math.round(x_rim - sign * DELTA) != Math.round(x_rim_future)) {
      if (this.checkStaticCollidX(x_rim_future)) {
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
     * 衝突有無は、ユニットの上辺（v<0の場合）もしくは下辺（v>0の場合）が衝突するかで判定する
     * この判定では、y方向の現在速度のみ考慮し、x方向の速度は無視する
     * （xとy両方の速度持つ場合、calcColidXDtとcalcColidYDtでそれぞれ衝突しなくても斜めに衝突する可能性が残る）
     *
     * 衝突する場合、衝突するまでの時間を返す。
     * 衝突しない場合、undefinedを返す。
     */
    const LIMIT = 0.99; //めり込まないように抑える
    const DELTA = 0.00001; //境界チェックを緩める
    if (this.v.y == 0) return;

    const sign = Math.sign(this.v.y);
    const y_rim = this.position.y + (sign * this.physicalSize) / 2;
    const y_adjacent_tile = Math.round(this.position.y) + sign * 0.5;
    const y_rim_future = y_rim + this.v.y * dt;
    if (Math.round(y_rim - sign * DELTA) != Math.round(y_rim_future)) {
      if (this.checkStaticCollidY(y_rim_future)) {
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
      if (this.secInAir > this.secPreventGravity)
        this.accel(0, sceneState.gravity * dt);
      this.secInAir += dt;
    } else {
      this.secInAir = 0;
    }

    // 速度の適用（位置の更新）
    const abs_speed = Math.max(Math.abs(this.v.x), Math.abs(this.v.y));
    const l = abs_speed * dt;
    const num_steps = Math.ceil(l);
    for (let i = 0; i < num_steps; i++) {
      const dl = l - i >= 1 ? 1 : l - i;
      const _dt = dl / abs_speed;

      const collid_dt = this.calcCollidTime(dt);

      if (collid_dt.x !== undefined && collid_dt.y !== undefined) {
        //xy方向同時衝突の場合xの速度を0と見なして再実行する
        const sign_x = Math.sign(this.v.x);
        this.position.x =
          Math.round(this.position.x) + (sign_x * (1 - this.physicalSize)) / 2;
        this.v.x = 0;

        const retry_collid_dt = this.calcCollidTime(dt);
        if (retry_collid_dt.y !== undefined) {
          const sign_y = Math.sign(this.v.y);
          const new_y =
            Math.round(this.position.y) +
            (sign_y * (1 - this.physicalSize)) / 2;
          this.v.y = 0;
          if (this.position.y != new_y) {
            this.position.y = new_y;
            console.log("colid y", this.position.x, this.position.y);
          }
        } else {
          this.position.y += this.v.y * _dt;
        }
      } else {
        if (collid_dt.x !== undefined) {
          //x方向衝突
          const sign_x = Math.sign(this.v.x);
          const new_x =
            Math.round(this.position.x) +
            (sign_x * (1 - this.physicalSize)) / 2;
          if (this.position.x != new_x) {
            this.position.x = new_x;
            console.log("colid x", this.position.x, this.position.y);
          }
          this.v.x = 0;
        } else {
          this.position.x += this.v.x * _dt;
        }
        if (collid_dt.y !== undefined) {
          //y方向衝突
          const sign_y = Math.sign(this.v.y);
          const new_y =
            Math.round(this.position.y) +
            (sign_y * (1 - this.physicalSize)) / 2;
          if (this.position.y != new_y) {
            this.position.y = new_y;
            console.log("colid y", this.position.x, this.position.y);
          }
          this.v.y = 0;
        } else {
          this.position.y += this.v.y * _dt;
        }
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

    if (DEBUG_LOG) {
      if (this.v.x != 0 || this.v.y != 0) {
        console.log("phsics", this.objId, this.position.x, this.position.y);
      }
    }
    if (this.isInCollidObject()) {
      console.error("unit in collidion");
    }

    this.applyPosToGraphics();
  }
}

export const sceneState = new SceneState();
