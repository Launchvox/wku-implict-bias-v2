var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// For Photon Cloud Application access create cloud-app-info.js file in the root directory (next to default.html) and place next lines in it:
//var AppInfo = {
//    AppId: "your app id",
//    AppVersion: "your app version",
//}
// fetching app info global variable while in global context
var AppWss = this["AppInfo"] && this["AppInfo"]["Wss"];
var AppAppId = this["AppInfo"] && this["AppInfo"]["AppId"] ? this["AppInfo"]["AppId"] : "<no-app-id>";
var AppAppVersion = this["AppInfo"] && this["AppInfo"]["AppVersion"] ? this["AppInfo"]["AppVersion"] : "1.0";
var AppFbAppId = this["AppInfo"] && this["AppInfo"]["FbAppId"];
var AppConstants = {
    EvClick: 1,
    //    EvGetMap: 2, // for debug only
    //    EvGetMapProgress: 3,
    EvNewGame: 4,
    MasterEventMax: 100,
    EvGameStateUpdate: 101,
    EvPlayersUpdate: 102,
    EvGameMap: 103,
    EvClickDebug: 104,
    EvShowCards: 105,
    EvHideCards: 106,
    //    EvGameMapProgress: 107,
    EvMoveTimer: 108,
    EvDisconnectOnAlreadyConnected: 151,
    GameStateProp: "gameState",
    MoveCountProp: "moveCount",
    LogLevel: Exitgames.Common.Logger.Level.DEBUG
};
var App = /** @class */ (function (_super) {
    __extends(App, _super);
    function App(canvas) {
        var _this = _super.call(this, AppWss ? Photon.ConnectionProtocol.Wss : Photon.ConnectionProtocol.Ws, AppAppId, AppAppVersion) || this;
        _this.canvas = canvas;
        _this.useGroups = false;
        _this.automove = false;
        _this.logger = new Exitgames.Common.Logger("App:", AppConstants.LogLevel);
        _this.autoClickTimer = 0;
        _this.cellWidth = 96;
        _this.cellHeight = 96;
        _this.bgColor = 'rgba(100,100,100,255)';
        _this.gridColor = 'rgba(180,180,180,255)';
        _this.shownCards = [];
        _this.masterClient = new MasterClient(_this);
        // uncomment to use Custom Authentication
        // this.setCustomAuthentication("username=" + "yes" + "&token=" + "yes");
        Output.log("Init", AppAppId, AppAppVersion);
        _this.logger.info("Init", AppAppId, AppAppVersion);
        _this.setLogLevel(AppConstants.LogLevel);
        return _this;
    }
    // sends to all including itself
    App.prototype.raiseEventAll = function (eventCode, data, options) {
        options = options || {};
        options.receivers = Photon.LoadBalancing.Constants.ReceiverGroup.All;
        this.raiseEvent(eventCode, data, options);
    };
    // overrides
    App.prototype.roomFactory = function (name) { return new AppRoom(this, name); };
    App.prototype.actorFactory = function (name, actorNr, isLocal) { return new AppPlayer(this, name, actorNr, isLocal); };
    App.prototype.myRoom = function () { return _super.prototype.myRoom.call(this); };
    App.prototype.myActor = function () { return _super.prototype.myActor.call(this); };
    App.prototype.myRoomActors = function () { return _super.prototype.myRoomActors.call(this); };
    App.prototype.start = function () {
        this.stage = new createjs.Stage(this.canvas);
        this.setupUI();
        this.myRoom().loadResources(this.stage);
        //        this.connectToRegionMaster("EU");
    };
    // overrides
    App.prototype.onError = function (errorCode, errorMsg) {
        Output.log("Error", errorCode, errorMsg);
        // optional super call
        _super.prototype.onError.call(this, errorCode, errorMsg);
    };
    App.prototype.onOperationResponse = function (errorCode, errorMsg, code, content) {
        this.masterClient.onOperationResponse(errorCode, errorMsg, code, content);
        if (errorCode) {
            switch (code) {
                case Photon.LoadBalancing.Constants.OperationCode.JoinRandomGame:
                    switch (errorCode) {
                        case Photon.LoadBalancing.Constants.ErrorCode.NoRandomMatchFound:
                            Output.log("Join Random:", errorMsg);
                            this.createAppRoom();
                            break;
                        default:
                            Output.log("Join Random:", errorMsg);
                            break;
                    }
                    break;
                case Photon.LoadBalancing.Constants.OperationCode.CreateGame:
                    if (errorCode != 0) {
                        Output.log("CreateGame:", errorMsg);
                        this.disconnect();
                    }
                    break;
                case Photon.LoadBalancing.Constants.OperationCode.JoinGame:
                    if (errorCode != 0) {
                        Output.log("CreateGame:", errorMsg);
                        this.disconnect();
                    }
                    break;
                default:
                    Output.log("Operation Response error:", errorCode, errorMsg, code, content);
                    break;
            }
        }
    };
    App.prototype.onEvent = function (code, content, actorNr) {
        this.masterClient.onEvent(code, content, actorNr);
        switch (code) {
            case AppConstants.EvDisconnectOnAlreadyConnected:
                Output.log("Disconnected by Master Client as already connected player");
                this.disconnect();
                break;
            case AppConstants.EvMoveTimer:
                var t = document.getElementById("info");
                t.textContent = "Your turn now! (" + content.timeout + " sec.)";
                break;
            case AppConstants.EvClickDebug:
                Output.log(content.msg);
                break;
            case AppConstants.EvShowCards:
                Output.log("show ", content.cards);
                for (var c in content.cards) {
                    this.showCard(parseInt(c), content.cards[c]);
                }
                if (content.resetShown) {
                    var App = this;
                    setTimeout(function () {
                        for (var c in content.resetShown.cards) {
                            App.hideCard(parseInt(content.resetShown.cards[c]), true);
                        }
                        App.stage.update();
                    }, GameProperties.cardShowTimeout);
                }
                this.stage.update();
                break;
            case AppConstants.EvHideCards:
                Output.log("hide ", content.cards);
                if (content.all) {
                    for (var i = 1; i <= this.myRoom().variety * 2; ++i) {
                        this.hideCard(i);
                    }
                }
                for (var k in content.cards) {
                    this.hideCard(content.cards[k]);
                }
                this.stage.update();
                break;
            default:
        }
        this.logger.info("App: onEvent", code, "content:", content, "actor:", actorNr);
    };
    App.prototype.onStateChange = function (state) {
        this.masterClient.onStateChange(state);
        // "namespace" import for static members shorter acceess
        var LBC = Photon.LoadBalancing.LoadBalancingClient;
        var stateText = document.getElementById("statetxt");
        stateText.textContent = LBC.StateToName(state);
        switch (state) {
            case LBC.State.JoinedLobby:
                this.joinRandomRoom();
                break;
            default:
                break;
        }
        this.updateRoomButtons();
        var t = document.getElementById("info");
        t.textContent = "Not in Game";
        this.updateAutoplay(this);
    };
    App.prototype.updateAutoplay = function (client) {
        clearInterval(this.autoClickTimer);
        var t = document.getElementById("autoplay");
        if (this.isConnectedToGame() && t.checked) {
            this.autoClickTimer = setInterval(function () {
                var hidden = [];
                var j = 0;
                for (var i = 1; i <= client.myRoom().variety * 2; ++i) {
                    if (!client.shownCards[i]) {
                        hidden[j] = i;
                        ++j;
                    }
                }
                if (hidden.length > 0) {
                    var card = hidden[Math.floor(Math.random() * hidden.length)];
                    client.raiseEventAll(AppConstants.EvClick, { "card": card });
                }
            }, 750);
        }
    };
    App.prototype.updateMasterClientMark = function () {
        var el = document.getElementById("masterclientmark");
        el.textContent = this.masterClient.isMaster() ? "!" : "";
    };
    App.prototype.onRoomListUpdate = function (rooms, roomsUpdated, roomsAdded, roomsRemoved) {
        //        Output.log("onRoomListUpdate", rooms, roomsUpdated, roomsAdded, roomsRemoved);
        this.updateRoomButtons(); // join btn state can be changed
    };
    App.prototype.onRoomList = function (rooms) {
        this.updateRoomButtons();
    };
    App.prototype.onJoinRoom = function () {
        this.updateMasterClientMark();
        this.masterClient.onJoinRoom();
        this.logger.info("onJoinRoom myRoom", this.myRoom());
        this.logger.info("onJoinRoom myActor", this.myActor());
        this.logger.info("onJoinRoom myRoomActors", this.myRoomActors());
        this.updatePlayerOnlineList();
        this.setupScene();
        var game = this.myRoom().getCustomProperty("game");
        for (var card = 1; card <= this.myRoom().variety * 2; ++card) {
            // TODO: remove game.mapProgress check after empty object send bug fix
            var icon = game.mapProgress && game.mapProgress[card];
            if (icon) {
                this.showCard(card, icon);
            }
        }
        this.stage.update();
    };
    App.prototype.onActorJoin = function (actor) {
        this.updateMasterClientMark();
        this.masterClient.onActorJoin(actor);
        Output.log("actor " + actor.actorNr + " joined");
        this.updatePlayerOnlineList();
    };
    App.prototype.onActorLeave = function (actor) {
        this.updateMasterClientMark();
        this.masterClient.onActorLeave(actor);
        Output.log("actor " + actor.actorNr + " left");
        this.updatePlayerOnlineList();
    };
    // tools
    App.prototype.createAppRoom = function () {
        Output.log("New Game");
        this.myRoom().setEmptyRoomLiveTime(10000);
        this.createRoomFromMy("AppPairsGame (Master Client)");
    };
    App.prototype.setupScene = function () {
        this.shownCards = [];
        this.stage.removeAllChildren();
        this.canvas.width = this.cellWidth * this.myRoom().columnCount;
        this.canvas.height = this.cellHeight * this.myRoom().rowCount();
        this.drawBg();
        this.drawGrid();
        this.stage.update();
    };
    App.prototype.hideCard = function (card, checkMap) {
        var game = this.myRoom().getCustomProperty("game");
        // TODO: remove game.mapProgress check after empty object send bug fix
        if (checkMap && game.mapProgress && game.mapProgress[card]) {
            // leave it open
        }
        else {
            if (this.shownCards[card]) {
                this.stage.removeChild(this.shownCards[card]);
                this.shownCards[card] = null;
            }
        }
    };
    App.prototype.showCard = function (card, icon) {
        if (!this.shownCards[card]) {
            var img = this.myRoom().icon(icon - 1);
            var bitmap = new createjs.Bitmap(img);
            var col = this.myRoom().columnCount;
            bitmap.x = ((card - 1) % col) * this.cellWidth;
            bitmap.y = Math.floor((card - 1) / col) * this.cellHeight;
            this.stage.addChild(bitmap);
            this.shownCards[card] = bitmap;
        }
    };
    App.prototype.drawBg = function () {
        var bg = new createjs.Shape();
        bg.graphics.beginFill(this.bgColor).drawRect(0, 0, this.canvas.width, this.canvas.height);
        this.stage.addChild(bg);
    };
    App.prototype.drawGrid = function () {
        var grid = new createjs.Shape();
        var w = this.canvas.width;
        var h = this.canvas.height;
        for (var i = 0; i < this.myRoom().columnCount + 1; ++i) {
            var x = i * this.cellWidth;
            grid.graphics.setStrokeStyle(1);
            grid.graphics.beginStroke(this.gridColor).moveTo(x, 0).lineTo(x, h);
        }
        for (var i = 0; i < this.myRoom().rowCount() + 1; ++i) {
            var y = i * this.cellHeight;
            grid.graphics.setStrokeStyle(1);
            grid.graphics.beginStroke(this.gridColor).moveTo(0, y).lineTo(w, y);
        }
        this.stage.addChild(grid);
    };
    // ui
    App.prototype.setupUI = function () {
        var _this = this;
        this.stage.addEventListener("stagemousedown", function (ev) {
            var x = Math.floor(_this.stage.mouseX / _this.cellWidth);
            var y = Math.floor(_this.stage.mouseY / _this.cellHeight);
            _this.raiseEventAll(AppConstants.EvClick, { "card": x + y * _this.myRoom().columnCount + 1 });
            _this.stage.update();
        });
        var cb = document.getElementById("autoplay");
        cb.onchange = function () { return _this.updateAutoplay(_this); };
        var btn = document.getElementById("connectbtn");
        btn.onclick = function (ev) {
            var n = document.getElementById("playername");
            //                this.myActor().setName(n.value);
            var id = "n:" + n.value;
            // clients set actors's id
            _this.myActor().setInfo(id, n.value);
            _this.myActor().setCustomProperty("auth", { name: n.value });
            _this.connectToRegionMaster("EU");
        };
        btn = document.getElementById("disconnectbtn");
        btn.onclick = function (ev) {
            _this.disconnect();
            return false;
        };
        btn = document.getElementById("newgame");
        btn.onclick = function (ev) {
            _this.raiseEventAll(AppConstants.EvNewGame, null);
            return false;
        };
        btn = document.getElementById("newtrivial");
        btn.onclick = function (ev) {
            _this.raiseEventAll(AppConstants.EvNewGame, { trivial: true });
            return false;
        };
        this.updateRoomButtons();
    };
    App.prototype.updatePlayerOnlineList = function () {
        var list = document.getElementById("playeronlinelist");
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
        for (var i in this.myRoomActors()) {
            var a = this.myRoomActors()[i];
            var item = document.createElement("li");
            item.attributes["value"] = a.getName() + " /" + a.getId();
            item.textContent = a.getName() + " / " + a.getId() + " / " + a.actorNr;
            if (a.isLocal) {
                item.textContent = "-> " + item.textContent;
            }
            list.appendChild(item);
            this.logger.info("actor:", a);
        }
    };
    App.prototype.updateRoomButtons = function () {
        var btn;
        var connected = this.state != Photon.LoadBalancing.LoadBalancingClient.State.Uninitialized && this.state != Photon.LoadBalancing.LoadBalancingClient.State.Disconnected;
        btn = document.getElementById("connectbtn");
        btn.disabled = connected;
        btn = document.getElementById("fblogin");
        btn.disabled = connected;
        btn.hidden = !AppFbAppId;
        btn = document.getElementById("disconnectbtn");
        btn.disabled = !connected;
        btn = document.getElementById("newgame");
        btn.disabled = !this.isJoinedToRoom();
        btn = document.getElementById("newtrivial");
        btn.disabled = !this.isJoinedToRoom();
    };
    return App;
}(Photon.LoadBalancing.LoadBalancingClient));
var Output = /** @class */ (function () {
    function Output() {
    }
    Output.log = function (str) {
        var op = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            op[_i - 1] = arguments[_i];
        }
        var log = document.getElementById("log");
        var formatted = this.logger.formatArr(str, op);
        var newLine = document.createElement('div');
        newLine.textContent = formatted;
        log.appendChild(newLine);
        log.scrollTop = log.scrollHeight;
    };
    Output.logger = new Exitgames.Common.Logger();
    return Output;
}());
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
var AppPlayer = /** @class */ (function (_super) {
    __extends(AppPlayer, _super);
    function AppPlayer(App, name, actorNr, isLocal) {
        var _this = _super.call(this, name, actorNr, isLocal) || this;
        _this.App = App;
        return _this;
    }
    AppPlayer.prototype.getId = function () {
        return this.getCustomProperty("id");
    };
    AppPlayer.prototype.getName = function () {
        return this.getCustomProperty("name");
    };
    AppPlayer.prototype.onPropertiesChange = function (changedCustomProps) {
        if (this.isLocal) {
            document.title = this.getName() + " / " + this.getId() + " Pairs Game (Master Client)";
        }
        this.App.updatePlayerOnlineList();
    };
    AppPlayer.prototype.setInfo = function (id, name) {
        this.App.setUserId(id);
        this.setCustomProperty("id", id);
        this.setCustomProperty("name", name);
    };
    return AppPlayer;
}(Photon.LoadBalancing.Actor));
var loadBalancingClient;
window.onload = function () {
    loadBalancingClient = new App(document.getElementById("canvas"));
    loadBalancingClient.start();
};
