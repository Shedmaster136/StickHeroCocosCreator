const {ccclass, property} = cc._decorator;
import EventNames = require("../Events");

@ccclass
export default class BonusPool extends cc.Component {

    

    @property(cc.Node)
    gameControl: cc.Node = null;

    @property(cc.Prefab)
    bonusPrefab: cc.Prefab = null;
    
    @property(cc.Node)
    camera: cc.Node = null;

    private _bonusPool: cc.NodePool = null;
    private _addedBonuses: Array<cc.Node> = [];
    private _canvasH: number = 0;
    


    // LIFE-CYCLE CALLBACKS:

    //=========================================================================================================
    onLoad () {
        this._canvasH = cc.find('Canvas').height;
        this._bonusPool = new cc.NodePool();
        this.gameControl.on(EventNames.GENERATE_BONUS, this.onBonusCreate, this);
        this.gameControl.on(EventNames.GAME_OVER, this.onRestartGame, this);
    }

    //removes all bonuses from the game 
    onRestartGame(){
        if(this._bonusPool){
            this._bonusPool.clear();
        }
        if(this._addedBonuses){
            for (let i = 0; i < this._addedBonuses.length; ++i)
            {
                this._addedBonuses[i].off(EventNames.COLLECT_BONUS);
                this._addedBonuses[i].destroy();
            }
            this._addedBonuses = [];
        }
    }

    //creates the bonus and defines its position
    onBonusCreate(shape: cc.Node){
        if(!shape){
            return;
        }
        let bonus: cc.Node = null;
        if(this._bonusPool.size() === 0){
            bonus = cc.instantiate(this.bonusPrefab);
            bonus.on(EventNames.COLLECT_BONUS, this.recycleBonus, this);
            this._bonusPool.put(bonus);
        }
        bonus = this._bonusPool.get();
        bonus.parent = this.node;
        this._addedBonuses.push(bonus);
        this.bonusPosition(shape, bonus)
    }
    
    //=========================================================================================================
    bonusPosition(shape: cc.Node, bonus: cc.Node): void{
        let placeAbove = Math.round(Math.random()) ? true: false;
        if(!shape.getComponent(cc.PhysicsBoxCollider)){
            return;
        }

        let anchor = shape.getAnchorPoint();
        if (anchor.y !== 0){
            return;
        }
        
        //find where bridge crosses with the platform
        let length = shape.height;
        let rayStart = shape.convertToWorldSpaceAR(new cc.Vec2(0,0));
        let rayEnd = new cc.Vec2(rayStart.x + length, rayStart.y);
        let maxPos = 0;
        let minPos = rayStart.x;
        maxPos = this.findShapeColliderX(rayStart,rayEnd,shape);
        if(maxPos === 0 ){
            return;
        }

        //find where bridge comes out of the parent platform
        rayStart = new cc.Vec2(maxPos, rayStart.y);
        rayEnd = new cc.Vec2(rayStart.x - length, rayStart.y);
        minPos = this.findShapeColliderX(rayStart, rayEnd, shape);

        //minus width of the bonus, so that it would not clip into the platform
        maxPos -= this.bonusPrefab.data.width * (1-this.bonusPrefab.data.anchorX);
        minPos += this.bonusPrefab.data.width * this.bonusPrefab.data.anchorX;

        //define X of the bonus
        let X = Math.random() *(maxPos - minPos) + minPos;

        //find where is the bridge's Y, that corresponds to X
        let rayY = 0;
        let endY = this._canvasH;
        let shiftY = -this.bonusPrefab.data.height * (1 - this.bonusPrefab.data.anchorY);
        if (placeAbove){
            rayY = this._canvasH;  
            endY = 0;
            shiftY = this.bonusPrefab.data.height * this.bonusPrefab.data.anchorY;
        }
        rayStart = new cc.Vec2(X, rayY);
        rayEnd = new cc.Vec2(X, endY);
        let result = cc.director.getPhysicsManager().rayCast(rayStart, rayEnd, cc.RayCastType.All);
        if (result.length !== 1){
            return;
        }
        let Y = result[0].point.y + shiftY;

        bonus.position = new cc.Vec3(X, Y, 0);
    }

    findShapeColliderX(rayStart: cc.Vec2, rayEnd: cc.Vec2, shape: cc.Node) : number{
        let result = cc.director.getPhysicsManager().rayCast(rayStart, rayEnd, cc.RayCastType.All);
        for(let i = 0; i < result.length; ++i){
            if(shape.name !== result[i].collider.node.name){
                return result[i].point.x;
            }
        }
        return 0;
    }

    recycleBonus(bonus: cc.Node, outOfBounds?: boolean): void{
        for(let i = 0; i < this._addedBonuses.length; ++i){
            if(bonus === this._addedBonuses[i]){
                this._addedBonuses[i].removeFromParent(false);
                this._bonusPool.put(this._addedBonuses[i]);
                this._addedBonuses.splice(i,1);
            }
        }
        if(outOfBounds === undefined || outOfBounds ===false){
            this.gameControl.emit(EventNames.BONUS_SOUND);
            this.gameControl.emit(EventNames.SCORE, 1);
        }
    }
    
    //check for bonuses out of bounds of the camera and recycle them
    checkOutOfBounds(){
        for(let i= 0; i < this._addedBonuses.length; ++i){
            let bonusX = this._addedBonuses[i].position.x;
            let cameraX = this.camera.position.x;
            let outOfBounds = (cameraX-bonusX) > 0 ? true : false;
            if(outOfBounds){
                this.recycleBonus(this._addedBonuses[i]);
                break;
            }
        }
    }

    start () {
        
    }

    update (dt) {
        this.checkOutOfBounds();
    }
}
 