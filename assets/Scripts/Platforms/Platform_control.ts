const {ccclass, property} = cc._decorator;
import EventNames = require("../Events");


@ccclass
export default class Platform extends cc.Component {
//properties declarations
    @property
    isActive: boolean = false;

    @property(cc.Node)
    gameControl:cc.Node = null;

    @property
    get width():number{
        return this._width;
    }
    set width(value: number){
        let Base = this.node.getChildByName("Base");
        if (value < this._min_width){
            return;
        }
        if(Base){ 
            Base.width = value;
            let collider = Base.getComponent(cc.PhysicsBoxCollider);
            if(collider) {
                collider.size.width = value;
                collider.offset.x = -value/2;
                collider.apply();
            }
        }
        else{return;}
        this._width = value;
    }

    @property
    get height():number{
        return this.node.position.y;
    }
    set height(value:number){
        this.node.position = new cc.Vec3(
            this.node.position.x, 
            value, 
            this.node.position.z);
    }
    
    //child nodes
    private _bridge: cc.Node = null;
    private _base: cc.Node = null;
    private _bonus: cc.Node = null;
    private _missSensor: cc.Node = null;
    //node parameters
    private _growthRate = 250;
    private _min_width = 50;
    private _width: number = 160;
    private _defBridgeHeight = 0;
    //Node states
    private _growBridge:boolean = false;
    private _gamePause:boolean = false;

    // LIFE-CYCLE CALLBACKS:
    
    //=========================================================================================================
    //1. Get child nodes and register event handlers for each
    //2. Register handlers for global events
    onLoad () {
        //1
        if(this.node.children.length === 4){
            this._bridge = this.node.getChildByName("Bridge");
            this._base = this.node.getChildByName("Base");
            this._missSensor = this.node.getChildByName("MissSensor");
            this._bonus = this.node.getChildByName("Bonus");
            this._base.on(EventNames.CHARACTER_PASSED, this.onCharacterPassed, this);
            this._base.on(EventNames.MOVE_CHARACTER, this.onMoveCharacter, this);
            this._base.on(EventNames.GENERATE_BONUS,this.onBonusGenerate,this)
            this._missSensor.on(EventNames.GAME_OVER, this.onBridgeMissed, this);
            this._defBridgeHeight = this._bridge.height;
        }
        //2
        if(this.gameControl)
        {
            this.gameControl.on(EventNames.GROW_BRIDGE, this.onGrowBridge, this);
            this.gameControl.on(EventNames.DROP_BRIDGE, this.onDropBridge, this);
            this.gameControl.on(EventNames.GAME_PAUSE, this.onGamePause, this);
        }
    }

    onDestroy(): void {
        this._base.off(EventNames.CHARACTER_PASSED);
        this._base.off(EventNames.MOVE_CHARACTER);
        this._base.off(EventNames.GENERATE_BONUS);
        this._missSensor.off(EventNames.GAME_OVER);
    }
    
    onBonusGenerate(shape:cc.Node){
        this.gameControl.emit(EventNames.GENERATE_BONUS, shape);
    }

    onBridgeMissed(){
        this.gameControl.emit(EventNames.GAME_OVER);
    }

    onGamePause(paused:boolean){
        this._gamePause = paused;
    }

    onMoveCharacter(){
        this.checkForBonus();
        if(this.gameControl){
            this.gameControl.emit(EventNames.MOVE_CHARACTER);
        }
    }

    onCharacterPassed (){
        this.isActive = true;
        this.node.emit(EventNames.MOVE_CAMERA, this.node);
        this.gameControl.emit(EventNames.CHARACTER_PASSED);
    }

    onGrowBridge(){
        if(!this.isActive){
            return;
        }
        this._growBridge = true;
    }

    //Adjust collider box and kick it down
    onDropBridge(){
        if(!this.isActive){
            return;
        }
        if(this._growBridge){
            this._growBridge = false;
            let collider = this._bridge.getComponent(cc.PhysicsBoxCollider);
            collider.size.height = this._bridge.height;
            collider.offset.y = this._bridge.height/2;
            collider.apply();
            this.isActive = false;
            this.kickBridge();
        }
     
    }

    //=========================================================================================================
    //NodePool control functions
    //to reuse an unuse elements
    
    reuse(gameControl: cc.Node, height: number, width: number, position: number){
        this.gameControl = gameControl;
        this.isActive = false;
        this.height = height;
        this.width = width;
        //
        this.node.emit(EventNames.RESET_BRIDGE);
        // 
        this.node.position = new cc.Vec3(position, this.node.position.y, this.node.position.z);
        if(!this._bonus){
            this._bonus = this.node.getChildByName("Bonus");
        }
        let bonusPosMax = this.node.width - 70;
        let bonusPosMin = this.node.width - width;
        if (bonusPosMax < bonusPosMin){
            return;
        }
        let bonusPos = Math.random() *(bonusPosMax - bonusPosMin) + bonusPosMin;
        this._bonus.position = new cc.Vec3(bonusPos, this._bonus.position.y, this._bonus.position.z);
    }

    unuse(){
        this.returnBridge();
    }
    //=========================================================================================================
    //apply force to the bridge
    kickBridge(){
        let rigidBody = this._bridge.getComponent(cc.RigidBody);
        rigidBody.fixedRotation = false;
        if(rigidBody){
            let point = cc.v2(0, this._bridge.height)
            let globalPoint = this._bridge.convertToWorldSpaceAR(point);
            let force = cc.v2(3000, 0);
            rigidBody.applyForce(force, globalPoint, true);

        }
    }
    //return bridge to default position
    returnBridge(){
        if(this._bridge){
            if (this._bridge.angle != 0)
            {
                let rigidBody = this._bridge.getComponent(cc.RigidBody);
                let collider = this._bridge.getComponent(cc.PhysicsBoxCollider);
                rigidBody.fixedRotation = true;
                this._bridge.angle = 0;
                this._bridge.height = this._defBridgeHeight;
                rigidBody.syncRotation(false);
                rigidBody.syncPosition(false);
                collider.size.height = this._defBridgeHeight;
                collider.offset.x = 0;
                collider.offset.y = this._defBridgeHeight/2;
                collider.apply();
            }
        }
    }
    //checks if the tip of a bridge is within bonus radius
    //Throws two rays upward and checks for collisions
    checkForBonus(){
        let rayStart = cc.v2(this._bonus.position.x, this._bonus.position.y);
        rayStart = this.node.convertToWorldSpaceAR(rayStart);
        let rayEnd = cc.v2(rayStart.x,rayStart.y + 600);
        let result = cc.director.getPhysicsManager().rayCast(rayStart, rayEnd, cc.RayCastType.All);
        if(result.length === 1){
            let bonusWidth = this._bonus.width
            rayStart = cc.v2(rayStart.x + bonusWidth, rayStart.y);
            result = cc.director.getPhysicsManager().rayCast(rayStart, rayEnd, cc.RayCastType.All);
            if(result.length === 1){
            }
            else{
                this.bonusTween();
                this.gameControl.emit(EventNames.SCORE,1);
            }
        }

    }

    bonusTween(){
        cc.tween(this._bonus)
            .to(0.2, {color: new cc.Color(0,255,0)})
            .to(0.2, {color: new cc.Color(255,0,0)})
            .start();
    }

    start () {

    }

    update (dt) {
        if(this._gamePause){
            return;
        }
        if (this._growBridge){
            this._bridge.height += this._growthRate * dt;
        }
    }
}
