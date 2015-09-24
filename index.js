function Heart (interval, event, data) {
  this.interval = interval;
  this.event = event != undefined ? event : "heartbeat";
  this.data = data != undefined ? data : 1;
  this.vessels = [];
  this.timer = null;
}

Heart.prototype.add = function(res) {
  this.vessels.push(res);
  res.on("close", (function() {
    this.remove(res);
  }).bind(this));
};

Heart.prototype.remove = function(res) {
  var index = this.vessels.indexOf(res);
  if (index > -1) {
    this.vessels.splice(index, 1);
  }
};

Heart.prototype.pump = function () {
  for (var i=0; i<this.vessels.length; i++) {
    var res = this.vessels[i];
    sse.send(res, this.data, this.event);
  }
};

Heart.prototype.start = function() {
  this.timer = setTimeout((function () {
    this.pump();
    this.start();
  }).bind(this), this.interval);
};

Heart.prototype.stop = function() {
  clearTimeout(this.timer);
};

var sse = {
  prepare: function prepareServerEventResponse (req, res, init) {
    req.socket.setTimeout(Infinity);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
    if (!init) {
      init = "\n";
    }
    res.write(init);
  },

  send: function sendServerEvent (res, data, ev, id) {
    if (id !== undefined) res.write("id: " + id + "\n");
    if (ev !== undefined) res.write("event: " + ev + "\n");
    res.write("data: " + data + "\n\n");
    res.flush && res.flush();
  },

  Heart: Heart
};

module.exports = sse;
