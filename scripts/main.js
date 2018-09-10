// Variable initialisation
var canvas = document.querySelector('#canvas');
var context = canvas.getContext('2d');

// Canvas settings
var toolSize = '5';
var toolColor = 'black';
var linePoints = [];
var canvasState = [];

// Event listeners
canvas.addEventListener('mousedown', draw);
canvas.addEventListener('touchstart', draw);
window.addEventListener('mouseup', stop);
window.addEventListener('touchend', stop);
window.addEventListener('resize', resizeCanvas);

resizeCanvas();

function draw(e) {
    if (e.which === 1 || e.type === 'touchstart' || e.type === 'touchmove') {
        window.addEventListener('mousemove', draw);
        window.addEventListener('touchmove', draw);

        var mouseX = e.pageX - canvas.offsetLeft;
        var mouseY = e.pageY - canvas.offsetTop;
        var mouseDrag = e.type === 'mousemove';

        console.log(mouseX);
        console.log(mouseY);

        if (e.type === 'touchstart' || e.type === 'touchmove' ) {
            mouseX = e.touches[0].pageX - canvas.offsetLeft;
            mouseY = e.touches[0].pageY - canvas.offsetTop;
            mouseDrag = e.type === 'touchmove';
        }

        if (e.type === 'mousedown' || e.type === 'touchstart') saveState();

        linePoints.push({
            x: mouseX,
            y: mouseY,
            drag: mouseDrag,
            width: toolSize,
            color: toolColor
        });

        updateCanvas();
    }
}

function renderLine() {
    for (var i = 0, length = linePoints.length; i < length; i++) {
        if (!linePoints[i].drag) {
            context.beginPath();

            context.lineWidth = linePoints[i].width;
            context.lineJoin = "round";
            context.lineCap = "round";
            context.strokeStyle = linePoints[i].color;

            context.moveTo(linePoints[i].x, linePoints[i].y);
            context.lineTo(linePoints[i].x + 0.5, linePoints[i].y + 0.5);
        } else {
            context.lineTo(linePoints[i].x, linePoints[i].y);
        }
    }

    context.stroke();
}

function saveState() {
    canvasState.unshift(context.getImageData(0, 0, canvas.width, canvas.height));
    linePoints = [];
    if (canvasState.length > 25) canvasState.length = 25;
}

function stop(e) {
    if (e.which === 1 || e.type === 'touchend') {
        window.removeEventListener('mousemove', draw);
        window.removeEventListener('touchmove', draw);
    }
}

function updateCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(canvasState[0], 0, 0);
    renderLine();
}

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    if ( canvasState.length ) updateCanvas();
}