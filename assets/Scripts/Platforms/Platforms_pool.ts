
const {ccclass, property} = cc._decorator;
import Platform from "./Platform_control";
import EventNames = require("../Events");
@ccclass
export default class PlatformsPool extends cc.Component {
    // LIFE-CYCLE CALLBACKS:

    @property(cc.Prefab)
    platformPrefab: cc.Prefab = null;
    
    @property(cc.Node)
    gameControl: cc.Node = null;

    @property(cc.Node)
    camera: cc.Node = null;

    private _defaultWidth = 150;
    private _minDistanceBtwPlat = 70;
    private _maxWidth = 200;
    private _minWidth = 70;
    private _tweenFadeInTime = 1.5;
    private _tweenCameraMoveTime = 1;
    private _canvasW = 0;
    private _canvasH = 0;

    private _platformsPool: cc.NodePool = null;
    private _addedPlatforms: Array<cc.Node> = [];


    //=========================================================================================================
    //initialize node pool and create first platform
    onLoad () {
        let canvas = cc.find('Canvas');
        let canvasSize = canvas.getContentSize();
        this._canvasW = canvasSize.width;
        this._canvasH = canvasSize.height;
        this._platformsPool = new cc.NodePool(Platform);
        this.gameControl.on(EventNames.GAME_OVER, this.onRestartGame, this);
        this.onRestartGame();
    }

    onRestartGame(){
        if(this._platformsPool){
            this._platformsPool.clear();
        }
        if(this._addedPlatforms){
            for (let i = 0; i < this._addedPlatforms.length; ++i)
            {
                this._addedPlatforms[i].destroy();
            }
            this._addedPlatforms = [];
        }
        this.createPlatform(this.node, 0,this._defaultWidth,0);
        this.camera.setPosition(0,0);
    }
    
    onMoveCamera (platform: cc.Node){
        this.moveCameraTween(platform.position);
        this.recyclePlatform();
        this.nextPlatformPosition(platform);
        this.scorePoint()
    }
    
    //=========================================================================================================
    
    scorePoint()
    {
        this.gameControl.emit(EventNames.SCORE, 1);
    }
    
    //creates new platforms and adds them to the existing platforms list
    createPlatform(parentNode: cc.Node, height: number, width: number, positionX:number){
        let platform: cc.Node = null;
        if(this._platformsPool.size() === 0){
            platform = cc.instantiate(this.platformPrefab);
            platform.on(EventNames.MOVE_CAMERA, this.onMoveCamera, this);
            this._platformsPool.put(platform);
        }
        platform = this._platformsPool.get(this.gameControl, height, width, positionX);
        platform.parent = parentNode;
        this._addedPlatforms.push(platform);
        this.platformFadeInTween(platform);
    }
    //recycle Platforms out of bounds
    recyclePlatform(){
        if (this._addedPlatforms.length >= 2){
            let cameraX = this.camera.position.x;
            let platformX = this._addedPlatforms[1].position.x;
            let outOfBounds = (cameraX-platformX) > 0 ? true : false;
            if (outOfBounds){
                this._addedPlatforms[0].removeFromParent(false);
                this._platformsPool.put(this._addedPlatforms[0]);
                this._addedPlatforms.shift();
            }
        }
    }
    //define next platform position.
    //depends on previous platform position
    nextPlatformPosition(prevPlatform: cc.Node){
        let width = Math.random() * (this._maxWidth - this._minWidth) + this._minWidth;
        let minPos = prevPlatform.position.x + this._minDistanceBtwPlat + width;
        let maxPos = 0;
        if(this._canvasH > this._canvasW){
            maxPos = prevPlatform.position.x + this._canvasW - prevPlatform.width;
        }else{
            maxPos = prevPlatform.position.x + this._canvasH - width;
        }
        let X = Math.random() *(maxPos - minPos) + minPos;
        this.createPlatform(this.node, 0, width, X);
    }
    


    platformFadeInTween(platform: cc.Node){
        platform.opacity = 0;
        cc.tween(platform)
            .to(this._tweenFadeInTime, {opacity: 255})
            .start();
    }

    moveCameraTween(pos: cc.Vec3){
        cc.tween(this.camera)
        .to(this._tweenCameraMoveTime, {position: new cc.Vec3(
            pos.x,
            pos.y,
            pos.z
        )})
        .start();
    }

    start () {

    }
    //check if there are 2 platforms out of border.
    //move platforms to the right when character moves to the next one
    update (dt) {

    }
}
