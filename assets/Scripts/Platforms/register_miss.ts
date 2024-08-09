
const {ccclass, property} = cc._decorator;
import EventNames = require("../Events");

@ccclass
export default class MissSensor extends cc.Component {


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider){
        this.scheduleOnce(()=>{this.node.emit(EventNames.GAME_OVER)},0);
    }




    start () {

    }

    // update (dt) {}
}
