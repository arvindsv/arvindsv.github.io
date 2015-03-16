var centerOn = function(baseElement, elementToBeCentered) {
  var baseRect = baseElement.bbox();
  var centerXOfBaseElement = baseRect.x + (baseRect.width / 2);
  var centerYOfBaseElement = baseRect.y + (baseRect.height / 2);

  elementToBeCentered.center(centerXOfBaseElement, centerYOfBaseElement);
  return draw.group().add(baseElement).add(elementToBeCentered);
};

var centerYOf = function(element) {
  var rect = element.bbox();
  return rect.y + (rect.height / 2);
};

var centerXOf = function(element) {
  var rect = element.bbox();
  return rect.x + (rect.width / 2);
};

var leftXOf = function(element) {
  var rect = element.bbox();
  return rect.x;
};

var rightXOf = function(element) {
  var rect = element.bbox();
  return rect.x + rect.width;
};

var box = function(name, width, height, options) {
  var options = options || {};
  var rect = draw.rect(width, height).attr({fill: options.fill || "#bad"});
  return centerOn(rect, draw.plain(name));
};

var drawArrow = function(fromElement, toElement) {
  var fromRect = fromElement.bbox();
  var toRect = toElement.bbox();

  var x1 = leftXOf(fromElement);
  var x2 = rightXOf(toElement);
  var y1 = centerYOf(fromElement);
  var y2 = centerYOf(toElement);

  var fullLinePathArray = new SVG.PathArray([
    ['M', x1, y1],
    ['L', x2, y2]
  ]);
  var fullLinePath = draw.path(fullLinePathArray.toString());

  var shortenedLineStart = fullLinePath.pointAt(10);
  var shortenedLineEnd = fullLinePath.pointAt(fullLinePath.length() - 40);
  var shortenedLinePathArray = new SVG.PathArray([
    ['M', shortenedLineStart.x, shortenedLineStart.y],
    ['L', shortenedLineEnd.x, shortenedLineEnd.y],
  ]);

  return fullLinePath.plot(shortenedLinePathArray.toString())
    .stroke({width: 3})
    .marker('end', arrowHead);
};

var sendMessage = function(path, message, response, options) {
  var options = options || {};
  var radius = options.radius || 40;
  var duration = options.duration || Tweene.defaultDuration;
  var complete = options.complete || (function() {});

  var messageShape = draw.circle(radius).attr({fill: "#faee0f"});
  var messageText = draw[message.indexOf("\n") == -1 ? "plain" : "text"].call(draw, message).font({size: 10});
  var messageWithText = centerOn(messageShape, messageText);
  var messageGroup = messageWithText.center(path.pointAt(0).x, path.pointAt(0).y).hide();
  var messageNodeSelector = "#" + messageGroup.id();

  var halfWidth = messageGroup.rbox().width / 2;
  var halfHeight = messageGroup.rbox().height / 2;
  var startX = path.pointAt(0).x - halfWidth;
  var startY = path.pointAt(0).y - halfHeight;
  var endX = path.pointAt(path.length()).x - halfWidth;
  var endY = path.pointAt(path.length()).y - halfHeight;

  var timeline = Tweene.line()

  var messageTween = Tweene.get(messageNodeSelector)
    .from({x: startX, y: startY})
    .to({ translateX: endX, translateY: endY })
    .options({
      duration: duration,
      begin: function() { messageText.text(message), messageGroup.show(); },
    });

  var responseTween = Tweene.get(messageNodeSelector)
    .to({ translateX: startX, translateY: startY })
    .options({
      duration: duration,
      begin: function() { messageText.text(response); },
      complete: function() { messageGroup.hide(); }
    });

  timeline.add(messageTween);
  timeline.add(responseTween);

  return timeline;
};

var showText = function(element, message) {
  return element[message.indexOf("\n") == -1 ? "plain" : "text"].call(element, message).x(Math.max(25, 200 - (element.rbox().width / 2)));
};
