
const {ccclass, property} = cc._decorator;
import EventNames = require("./Events");

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Node)
    gameControl: cc.Node = null;

    @property(cc.AudioSource)
    success: cc.AudioSource = null;

    @property(cc.AudioSource)
    fail: cc.AudioSource = null;

    @property(cc.AudioSource)
    bridge: cc.AudioSource = null;

    @property(cc.AudioSource)
    bonus: cc.AudioSource = null;

    @property(cc.AudioSource)
    background: cc.AudioSource = null;

    private gamePause = false;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.background.volume = 0.5;
        this.background.play();
        this.gameControl.on(EventNames.CHARACTER_PASSED, ()=>this.success.play(),this);
        this.gameControl.on(EventNames.GAME_OVER, ()=>this.fail.play(),this);
        this.gameControl.on(EventNames.MOVE_CHARACTER, ()=>this.bridge.play(),this);
        this.gameControl.on(EventNames.BONUS_SOUND, ()=>this.bonus.play(),this);
        this.gameControl.on(EventNames.GAME_PAUSE, this.onPause,this);
    }

    onPause(paused: boolean){
        if(paused){
            this.background.pause();
        }
        else{
            this.background.resume();
        }
    }

    start () {

    }

    // update (dt) {}
}
