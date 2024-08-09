import EventNames = require("../Events");
const {ccclass, property} = cc._decorator;

@ccclass
export default class BaseCollider extends cc.Component {


    public characterFlag:boolean = false;
    public bridgeFlag: boolean = false;
    private _surfaceGlobalCoord: number = null;

//=========================================================================================================
    // LIFE-CYCLE CALLBACKS:


    onLoad () {
        this.node.parent.on(EventNames.RESET_BRIDGE, ()=> {
            this.characterFlag = false;
            this.bridgeFlag = false;
        }, this);
        let surfaceLocal = this.node.height * this.node.anchorY;
        let globalCoord = this.node.convertToWorldSpaceAR(new cc.Vec2(0, surfaceLocal));
        this._surfaceGlobalCoord = globalCoord.y;
    }

    onDestroy(): void {
        this.node.parent.off(EventNames.RESET_BRIDGE);
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider){
        //I can identify the collided item by checking the group of a collider
        if(otherCollider.node.group === 'Character' && this.characterFlag === false){
            this.characterFlag = true;
            //check if collision is on the surface
            if(otherCollider.node.position.y > this._surfaceGlobalCoord)
            {
                this.scheduleOnce(()=>{this.node.emit(EventNames.CHARACTER_PASSED)},0);
            }
        }
        if(otherCollider.node.group === 'Bridge' && this.bridgeFlag === false){
            this.bridgeFlag = true;
            this.scheduleOnce(()=>{this.node.emit(EventNames.MOVE_CHARACTER)},0);
            this.scheduleOnce(()=>{this.node.emit(EventNames.GENERATE_BONUS, otherCollider.node)},0)
        }
    }


  
    start () {
    }

    // update (dt) {}
}
