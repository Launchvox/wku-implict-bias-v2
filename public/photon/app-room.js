var AppRoom = /** @class */ (function (_super) {
    __extends(AppRoom, _super);
    function AppRoom(App, name) {
        var _this = _super.call(this, name) || this;
        _this.App = App;
        // acceess properties every time
        _this.variety = 0;
        _this.columnCount = 0;
        _this.iconUrls = {};
        _this.icons = {};
        _this.variety = GameProperties.variety;
        _this.columnCount = GameProperties.columnCount;
        _this.iconUrls = GameProperties.icons;
        return _this;
    }
    AppRoom.prototype.rowCount = function () {
        return Math.ceil(2 * this.variety / this.columnCount);
    };
    AppRoom.prototype.iconUrl = function (i) {
        return this.iconUrls[i];
    };
    AppRoom.prototype.icon = function (i) {
        return this.icons[i];
    };
    AppRoom.prototype.onPropertiesChange = function (changedCustomProps, byClient) {
        //case AppConstants.EvGameStateUpdate:
        if (changedCustomProps.game) {
            var game = this.getCustomProperty("game");
            var t = document.getElementById("gamestate");
            t.textContent = JSON.stringify(game);
            t = document.getElementById("nextplayer");
            t.textContent = "";
            var turnsLeft = 0;
            for (var i = 0; i < game.nextPlayerList.length; i++) {
                if (turnsLeft == 0 && game.nextPlayerList[i] == this.App.myActor().getId()) {
                    turnsLeft = i;
                }
                t.textContent += " " + game.nextPlayerList[i];
            }
            var t = document.getElementById("info");
            t.textContent = turnsLeft == 0 ? "Your turn now!" : "Wait " + turnsLeft + " turn(s)";
            if (game.nextPlayer == this.App.myActor().getId()) {
                this.App.updateAutoplay(this.App);
            }
        }
        // case AppConstants.EvPlayersUpdate:
        if (changedCustomProps.game || changedCustomProps.playersStats) {
            var game = this.getCustomProperty("game");
            var playersStats = this.getCustomProperty("playersStats") || {};
            var list = document.getElementById("players");
            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }
            for (var i_1 in game.players) {
                var id = game.players[i_1];
                var item = document.createElement("li");
                item.attributes["value"] = id;
                var d = game.playersData[id];
                var s = playersStats && playersStats[id];
                item.textContent = d.name + " / " + id + ": " + d.hitCount + " / " + (d.hitCount + d.missCount) + (s ? " [" + s.hitCount + " / " + (s.hitCount + s.missCount) + " / " + s.gamesPlayed + "]" : "");
                item.title = "Player id: " + id + ", name: " + d.name + "\nCurrent game: hits = " + d.hitCount + ", clicks = " + (d.hitCount + d.missCount) + (s ? "\n Totals: games played = " + s.gamesPlayed + ", hits = " + s.hitCount + ", clicks = " + (s.hitCount + s.missCount) : "");
                list.appendChild(item);
            }
        }
    };
    AppRoom.prototype.loadResources = function (stage) {
        for (var i = 0; i < this.variety; ++i) {
            var img = new Image();
            this.icons[i] = img;
            img.onload = function () {
                Output.log("Image " + img.src + " loaded");
                stage.update();
            };
            img.src = this.iconUrl(i);
        }
    };
    return AppRoom;
}(Photon.LoadBalancing.Room));