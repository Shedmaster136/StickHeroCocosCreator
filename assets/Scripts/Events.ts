//Global list of events that controlls the game flow

class EventNames{
    static readonly GROW_BRIDGE = 'grow_bridge';            //on input, bridge starts to grow
    static readonly DROP_BRIDGE = 'drop_bridge';            //on end input, bridge stops growing
    static readonly MOVE_CHARACTER = 'move_character';      //character starts moving across the bridge
    static readonly CHARACTER_PASSED = 'character_passed';  //character stops moving
    static readonly MOVE_CAMERA = 'move_camera';            //camera changes position and next platform is generated
    static readonly GAME_OVER = 'game_over';                //all nodes are cleaned off the screen and character is repositioned
    static readonly GAME_START = 'game_start';              //inputs are activated and the game starts
    static readonly SCORE = "score";                        //allows to increase current scores
    static readonly TURN_OVER = "turn_over";                //on input turn the character over the bridge
    static readonly GENERATE_BONUS = "gen_bonus";           //generates bonus when the bridge is down
    static readonly COLLECT_BONUS = "col_bonus";            //character collects the bonus
    static readonly RESET_BRIDGE = "reset_bridge";          //bridge is reset to its default position and ready for reuse
    static readonly GAME_PAUSE = "game_pause";              //game is paused and nothing happens
    static readonly BONUS_SOUND = "bonus_sound";
}

export = EventNames;