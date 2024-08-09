
const {ccclass, property} = cc._decorator;
import EventNames = require("../Events");

@ccclass
export default class Bonus extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    onLoad () {}

    start () {

    }

    onPostSolve(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider){
        if(otherCollider.node.group === 'Character'){
            this.node.emit(EventNames.COLLECT_BONUS, this.node);
        }
    }

    update (dt) {}
}
