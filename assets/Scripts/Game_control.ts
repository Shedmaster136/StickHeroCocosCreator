import EventNames = require("./Events");

const {ccclass, property} = cc._decorator;


//Game changes inputs depending on its state:
enum gameState{
    Grow_Bridge,        //Input grows the bridge
    Turn_Character,     //Input allows to turn the character over the bridge
    Idle                //No inputs are accepted, except UI buttons
}

@ccclass
export default class GameControls extends cc.Component {

    @property(cc.Node)
    pressZone: cc.Node = null;

    @property(cc.Node)
    startButton: cc.Node = null;
    
    @property(cc.Node)
    pauseButton: cc.Node = null;

    @property(cc.Node)
    restartButton: cc.Node = null;

    @property(cc.Label)
    scoreCounterLabel: cc.Label = null;

    @property(cc.Label)
    gameOverLabel: cc.Label = null;

    @property
    devOptions:boolean =false;

    private _gamePaused: boolean = false;
    private _activateGameOver: boolean = false;

    private _highScore: number = 0;
    private _currentScore: number = -1;

    private _gameOverStr : string = "Game Over Score: ";
    private _scoreCounterStr1: string = "Current score: ";
    private _scoreCounterStr2: string = "High Score: ";

    private _gameState: gameState = gameState.Idle;


    //=========================================================================================================
    // LIFE-CYCLE CALLBACKS:
    //turn on physics
    //turn on collisions
    //reset all objects on screen
    //register events GameOver and Score
    onLoad () {
        cc.director.getPhysicsManager().enabled = true;
        cc.director.getCollisionManager().enabled = true;
        this.gameOverLabel.node.active = false;
        if (this.devOptions)
        {
            let physicsManager = cc.director.getPhysicsManager();
            physicsManager.debugDrawFlags = 
                cc.PhysicsManager.DrawBits.e_aabbBit | // Draw AABB (Axis-Aligned Bounding Box)
                cc.PhysicsManager.DrawBits.e_jointBit | // Draw joints
                cc.PhysicsManager.DrawBits.e_shapeBit;  //draw shapes
        }
        this.onGameOver();
        //These Buttons are implicitly regustered:
        //1 - StartGame
        //2 - RestartGame
        //3 - PauseGame
        this.node.on(EventNames.MOVE_CHARACTER, this.onActivateMoveCharacter, this);
        this.node.on(EventNames.CHARACTER_PASSED, this.onActivateGrowBridge, this); 
        this.node.on(EventNames.GAME_OVER, this.onGameOver, this);
        this.node.on(EventNames.SCORE, this.onScore, this);
        this.pressZone.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.pressZone.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onActivateMoveCharacter(){
        this._gameState = gameState.Turn_Character;
    }

    onActivateGrowBridge(){
        this._gameState = gameState.Grow_Bridge;
    }

    //Add number amount of scores to the counter
    onScore(point: number){
        if(point){
            this._currentScore += point;
            this.updateScore();
        }
    }


    //initialize the scene
    onGameOver(){
        this.startButton.active = true;
        this.pauseButton.active = false;
        this.restartButton.active = false;
        this._gameState = gameState.Idle;
        if(!this._activateGameOver){
            this._activateGameOver = true;
        }else{
            this.gameOverLabel.string = this._gameOverStr + this._currentScore;
            this.gameOverLabel.node.active = true;
        }
        if (this._currentScore > this._highScore){
            this._highScore = this._currentScore;
        }
        this._currentScore = -1;
        this.scoreCounterLabel.string = this._scoreCounterStr2 + this._highScore;
    }

    //To pause the game we need to:
    //1 - stop physics manager
    //2 - stop all update loops of other nodes using signal
    //3 - turn off signals from game control
    onPauseButtonClicked(){
        if(this._gamePaused)
        {
            this._gamePaused = false;
            cc.director.getPhysicsManager().enabled = true;
            this.node.resumeSystemEvents(false);
            this.node.emit(EventNames.GAME_PAUSE, false);
        }
        else{
            this._gamePaused = true;
            cc.director.getPhysicsManager().enabled = false;
            this.node.pauseSystemEvents(false);
            this.node.emit(EventNames.GAME_PAUSE, true);
        }
        
    }

    //When game is started adjust UI
    //Show current score
    //activate key listeners
    //Tell other nodes that the game is starting
    onStartButtonClicked(){
        this.startButton.active = false;
        this.pauseButton.active = true;
        this.restartButton.active = true;
        this.gameOverLabel.node.active = false;
        this.scoreCounterLabel.string = "Current score:"+ 0;
        this.node.emit(EventNames.GAME_START);
    }

    //Simulate game over and show the game over screen,
    //reset all nodes on the scene
    onRestartButtonClicked(){
        this.node.emit(EventNames.GAME_OVER);
    }

    //
    onTouchStart(event: cc.Event.EventTouch){
        switch(this._gameState){
            case gameState.Idle:
                break;
            case gameState.Grow_Bridge:
                this.node.emit(EventNames.GROW_BRIDGE);
                break;
            case gameState.Turn_Character:
                this.node.emit(EventNames.TURN_OVER);
                break;
        }
    }

    onTouchEnd(event: cc.Event.EventTouch){
        switch(this._gameState){
            case gameState.Grow_Bridge:
                this.node.emit(EventNames.DROP_BRIDGE);
                break;
        }
    }

    //=========================================================================================================

    //Update Label for showing score count
    updateScore(){
        this.scoreCounterLabel.string = this._scoreCounterStr1 + this._currentScore;
    }
    start () {

    }

    // update (dt) {}
}
