const {ccclass, property} = cc._decorator;
import EventNames = require("./Events");

@ccclass
export default class Character extends cc.Component {

    @property(cc.Node)
    gameControl: cc.Node = null;
    
    //private variables
    private _speed: number = 100;
    private _maxAngle: number = 44;
    private _minAngle: number = -44;
    private _distanceToTurn = 20;

    private _moveCharacter: boolean = false;
    private _onBridge: boolean = false;
    private _characterTurned: boolean = false;
    private _gamePause:boolean = false;
    
    private _startPos: cc.Vec3 = null;
    private _moveRight: cc.Vec2 = cc.v2(1,0); //direction of movement - to the right
    private _rigidBody: cc.RigidBody = null;
    private _collider: cc.PhysicsBoxCollider = null;


    //=========================================================================================================

    // LIFE-CYCLE CALLBACKS:
    //init private variables
    //register global events
    onLoad () {
        this._rigidBody = this.getComponent(cc.RigidBody);
        this._collider = this.getComponent(cc.PhysicsBoxCollider);
        this._startPos = new cc.Vec3(this.node.position.x, this.node.position.y, this.node.position.z);
        this.repositionCharacter();
        this.gameControl.on(EventNames.MOVE_CHARACTER, this.onMove, this);
        this.gameControl.on(EventNames.CHARACTER_PASSED, this.onStop, this); 
        this.gameControl.on(EventNames.GAME_START, () => {this._rigidBody.type = cc.RigidBodyType.Dynamic}, this);
        this.gameControl.on(EventNames.GAME_OVER, this.repositionCharacter, this);
        this.gameControl.on(EventNames.TURN_OVER, this.onTurnCharacter, this);
        this.gameControl.on(EventNames.GAME_PAUSE, this.onGamePause, this);
    }
    //stop update loop
    onGamePause(paused: boolean){
        this._gamePause = paused;
    }

    //decrease friction value
    onMove(){
        this._moveCharacter = true;
        this._collider.friction = 0.2;
        this._collider.apply();

    }  

    //increase friction so that character wouldn't fall off
    onStop(){
        this._moveCharacter = false;
        this._collider.friction = 3;
        this._collider.apply();
    }

    //turn character over the platform
    //check if he can turn over and
    //adjust his position and gravity
    onTurnCharacter(){
        let maxProblematicAngle = 40;
        let angle = Math.abs(this.node.angle);
        if (angle > maxProblematicAngle){
            this.node.angle = 0;
        }
        if(this._onBridge){
            let position = this.node.position;
            this._characterTurned
            if(!this._rigidBody){
                return;
            }
            if (this._characterTurned){
                this._rigidBody.gravityScale = 1;
                this._characterTurned = false;
                this.node.position = new cc.Vec3(position.x, position.y+this._distanceToTurn, position.z)
            }else{
                if(this.somethingUnderBridge()){
                    return;
                }
                this._rigidBody.gravityScale = -1;
                this._characterTurned = true;
                this.node.position = new cc.Vec3(position.x, position.y-this._distanceToTurn, position.z)
            }
        }
    }

    //if character is on the bridge, he can turn
    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider){
        if(otherCollider.node.group === 'Bridge'){
            this._onBridge = true;
        }
    }
    //if character touches platform when he is turned over, he falls
    onPostSolve(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider){
        if(otherCollider.node.group === 'Base'){
            if(this._characterTurned){
                if(this._rigidBody){
                    this._characterTurned = false;
                    this._rigidBody.gravityScale = 1;
                }
            }
        }
    }
    //if character is off the bridge, he can't turn
    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider){
        if(otherCollider.node.group === 'Bridge'){
            this._onBridge = false;
        }
    }

    //=========================================================================================================

    //check if character can be turned
    //Must return true or false
    somethingUnderBridge():boolean{
        let leftmostAngle = this.node.convertToWorldSpaceAR(
            new cc.Vec2(-this.node.width * (1-this.node.anchorX), - this.node.height*(1-this.node.anchorY))
        );
        let rayStart = leftmostAngle;
        let rayEnd = new cc.Vec2(rayStart.x, rayStart.y - 300);
        let result = cc.director.getPhysicsManager().rayCast(rayStart, rayEnd, cc.RayCastType.All);
        if (result.length <= 2){
            for(let i = 0; i < result.length; ++i){
                if(result[i].collider.node.name === "Bridge" || result[i].collider.node.name === "Bonus"){
                    continue;
                }
                else{
                    return true;
                }
            }
            return false;
        }
        return true;
    }
    //return character to its default position
    repositionCharacter(){
        this.node.position = new cc.Vec3(this._startPos);
        this.onStop();
        this.node.angle = 0;
        this._rigidBody.type = cc.RigidBodyType.Static;
        if(this._characterTurned){
            this.onTurnCharacter();
        }
    }


    start () {

    }



    update (dt) {
        if(this._gamePause){
            return;
        }
        //Move character
        if (this._moveCharacter){
            let currentSpeed = this._rigidBody.linearVelocity.mag();
            if(currentSpeed >= this._speed){
                this._rigidBody.linearVelocity = this._rigidBody.linearVelocity.normalize().mul(this._speed);
            }else{
                let force = this._moveRight.mul(this._speed);
                this._rigidBody.applyForceToCenter(force, true);
            }
        }
        //if character falls
        if (this.node.position.y <= 0){
            this.gameControl.emit(EventNames.GAME_OVER);
        }

        //Don't let character turn a lot
        if(this.node.angle > this._maxAngle){
            this._rigidBody.angularVelocity = 200;
        }else if(this.node.angle < this._minAngle){
            this._rigidBody.angularVelocity = -200;
        }
   
    }
}
