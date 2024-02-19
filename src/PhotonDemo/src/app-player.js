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