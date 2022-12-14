import { Func } from '../core/func';
import { Canvas } from '../webgl/canvas';
import { Object3D } from 'three/src/core/Object3D';
import { Update } from '../libs/update';
import { SphereGeometry } from 'three/src/geometries/SphereGeometry';
// import { BoxGeometry } from 'three/src/geometries/BoxGeometry';
import { Scroller } from "../core/scroller";
import { Tween } from "../core/tween";
import { Util } from "../libs/util";
import { Item } from "./item";
import { Color } from 'three/src/math/Color';
import { Conf } from '../core/conf';
import { HSL } from '../libs/hsl';
import { PointLight } from 'three/src/lights/PointLight';
import { itemScroll } from './itemScroll';
import { Easing } from '../libs/easing';

export class Visual extends Canvas {

  private _con:Object3D;

  private _itemWrapperA:Object3D;
  private _itemA:Array<Item> = [];

  private _itemWrapperB:Object3D;
  private _itemB:Array<Item> = [];

  private _scrollItem:itemScroll;

  private _bgColor:Color = new Color();

  private _scroll:number = 0;

  constructor(opt: any) {
    super(opt);

    const light = new PointLight(new Color(Util.instance.random(0, 1), Util.instance.random(0, 1), Util.instance.random(0, 1)), 1);
    this.mainScene.add(light)
    light.position.x = Func.instance.sw() * 1;
    light.position.y = Func.instance.sh() * 1.2;
    light.position.z = Func.instance.sh() * 1;

    this._con = new Object3D();
    this.mainScene.add(this._con);

    this._itemWrapperA = new Object3D();
    this._con.add(this._itemWrapperA);

    this._itemWrapperB = new Object3D();
    this._con.add(this._itemWrapperB);

    const col = Util.instance.randomArr(Conf.instance.COLOR).clone();
    const hsl = new HSL();
    col.getHSL(hsl);
    hsl.l *= 0.8;
    col.setHSL(hsl.h, hsl.s, hsl.l);
    this._bgColor = col;

    const seg = 128
    const geo = new SphereGeometry(0.5, seg, seg);
    // const geo = new BoxGeometry(1,1,1);
    const num = 8;

    for(let i = 0; i < num; i++) {
      const itemA = new Item({
        geo:geo,
        test:0,
        lightCol:light.color,
        isLast:i == num - 1
      });
      this._itemWrapperA.add(itemA);
      this._itemA.push(itemA);
    }

    for(let i = 0; i < num; i++) {
      const itemB = new Item({
        geo:geo,
        test:1,
        lightCol:light.color,
        isLast:i == num - 1
      });
      this._itemWrapperB.add(itemB);
      this._itemB.push(itemB);
    }

    // ??????????????????
    this._scrollItem = new itemScroll({
      col:this._bgColor.clone()
    })
    this._con.add(this._scrollItem);

    this._con.rotation.x = Util.instance.radian(45);
    this._con.rotation.y = Util.instance.radian(-45);

    Scroller.instance.set(0);
    this._resize()
  }


  protected _update(): void {
    super._update()

    const sw = Func.instance.sw()
    const sh = Func.instance.sh()

    this._con.position.y = Func.instance.screenOffsetY() * -1

    const scroll = Scroller.instance.val.y;
    const scrollArea = sh * 3;
    const itemSize = sw * Func.instance.val(0.4, 0.3);

    this._scroll += (scroll - this._scroll) * 0.1;

    Tween.instance.set(document.querySelector('.l-height'), {
      height:scrollArea
    })

    // 0-1?????????
    const sRate = Util.instance.map(this._scroll, 0, 1, 0, scrollArea - sh);

    this._scrollItem.scale.set(sw * 0.25, itemSize, 1);
    this._scrollItem.rotation.y = Util.instance.radian(90);
    this._scrollItem.position.z = Util.instance.map(sRate, sh, -sh * 2, 0, 1);

    const cutRate = Util.instance.map(this._scrollItem.position.z, 1, 0, -itemSize * 0.5 - this._scrollItem.scale.x * 0.5, itemSize * 0.25 + this._scrollItem.scale.x * 0.5)
    // const cutRate2 = Easing.instance.inOutSine(Util.instance.map(cutRate, 0, 1, 0.6, 1));
    const cutRate2 = Easing.instance.inOutSine(Util.instance.map(this._scrollItem.position.z, 1, 0, -itemSize * 0.5 - this._scrollItem.scale.x * 0.5 - sh * 2, -itemSize * 0.5 - this._scrollItem.scale.x * 0.5));

    this._itemWrapperA.position.z = Util.instance.mix(0, itemSize * 0.02, cutRate) * -1
    this._itemWrapperB.position.z = this._itemWrapperA.position.z * -1;

    this._itemWrapperA.position.x = Util.instance.mix(0, itemSize * 0, cutRate) + Util.instance.map(cutRate2, 0, itemSize * 1, 0, 1);
    this._itemWrapperB.position.x = this._itemWrapperA.position.x * -1;

    this._itemWrapperA.rotation.z = Util.instance.radian(Util.instance.map(cutRate2, 0, 100, 0, 1) * -1)
    this._itemWrapperA.rotation.y = Util.instance.radian(Util.instance.map(cutRate2, 0, 100, 0, 1) * -1)

    this._itemWrapperB.rotation.copy(this._itemWrapperA.rotation);
    this._itemWrapperB.rotation.x *= -1;
    this._itemWrapperB.rotation.y *= -1;
    this._itemWrapperB.rotation.z *= -1;

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }


  private _render(): void {
    this.renderer.setClearColor(this._bgColor, 1)
    this.renderer.render(this.mainScene, this.cameraPers)
  }


  public isNowRenderFrame(): boolean {
    return this.isRender && Update.instance.cnt % 1 == 0
  }


  _resize(isRender: boolean = true): void {
    super._resize();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    this._itemA.forEach((val,i) => {
      // const s = Util.instance.map(i, w * 0.1, w * 0.3, 0, this._itemA.length - 1);
      const s = w * Func.instance.val(0.4, 0.3) - (i * 10);
      val.scale.set(s, s, s);
      const val2 = this._itemB[i];
      val2.scale.copy(val.scale);
    })

    this.renderSize.width = w;
    this.renderSize.height = h;

    this._updateOrthCamera(this.cameraOrth, w, h);
    this._updatePersCamera(this.cameraPers, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();

    if (isRender) {
      this._render();
    }
  }
}
