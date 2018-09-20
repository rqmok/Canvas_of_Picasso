// Variable initialisation
var canvas = document.querySelector('#canvas');
var context = canvas.getContext('2d');

// Canvas settings
var tool = 'brush';
var toolSize = '5'; // need to choose same size as brush size since it is default
var toolColor = '#000000';
var linePoints = [];
var canvasState = [];

// Tracks the idle time of the user
var idleTimer = 0;
// The time (in seconds) when the canvas should be cleared
var clearCanvasTimeout = 60;

// Begin the timer to track idle time
window.setInterval(updateTimer, 1000); // Update the timer every minute

// Control Variables
var undoButton = document.querySelector( '[data-action=undo]' );
var sizeRange = document.querySelector( '#range_size' );
var sizeRangeLabel = document.querySelector( '#size_display' );

// Set the range value on start-up
sizeRange.value = sizeRangeLabel.value = toolSize;

// Event listeners
canvas.addEventListener('mousedown', draw);
canvas.addEventListener('touchstart', draw);
window.addEventListener('mouseup', stop);
window.addEventListener('touchend', stop);
window.addEventListener('resize', resizeCanvas);

document.querySelector( '#tools' ).addEventListener( 'click', selectTool );
document.querySelector( '#colors' ).addEventListener( 'click', selectColor );

sizeRange.addEventListener('input', selectSize)

// Functions
function selectSize() {
    toolSize = sizeRange.value;
}

function clearCanvas() {
    var result = confirm( 'Are you sure you want to delete the picture?' );
    if ( result ) {
        context.clearRect( 0, 0, canvas.width, canvas.height );
        canvasState.length = 0;
        undoButton.classList.add( 'disabled' );
    }
}

function draw(e) {
    if (e.which === 1 || e.type === 'touchstart' || e.type === 'touchmove') {
        resetIdleTimer();

        window.addEventListener('mousemove', draw);
        window.addEventListener('touchmove', draw);

        if (e.type === 'touchstart' || e.type === 'mousedown') saveState();

        switch (tool) {
            case 'brush':
                linePoints.push(getLinePointForBrush(e));
                break;
            case 'pen':
                linePoints.push(getLinePointForPen(e));
                break;
            case 'pencil':
                linePoints.push(getLinePointForPencil(e));
                break;
            default:
                // Fallback case
                linePoints.push(getBasicLinePoint(e));
        }

        updateCanvas();
    }
}

function highlightButton( button ) {
    var buttons = button.parentNode.querySelectorAll( 'img' );
    buttons.forEach( function( element ) { element.classList.remove( 'active' ) } );
    button.classList.add( 'active' );
    updateBorderColors();
}

function setPointContextSettings(i) {
    // Set context stroke settings based on the linePoints index given
    context.lineWidth = linePoints[i].width;
    context.strokeStyle = linePoints[i].color;
    context.globalAlpha = linePoints[i].opacity;
    context.lineCap = linePoints[i].lineCap;
    context.lineJoin = linePoints[i].lineJoin;
}

function renderLine() {
    if (tool != 'brush' && tool != 'pencil') {
        for (var i = 1, length = linePoints.length; i < length; i++) {
            // Source: http://perfectionkills.com/exploring-canvas-drawing-techniques/
            setPointContextSettings(i);

            context.beginPath();
            context.moveTo(linePoints[i - 1].x, linePoints[i - 1].y);
            context.lineTo(linePoints[i].x, linePoints[i].y);

            context.stroke();
        }
    } else {
        for (var i = 0, length = linePoints.length; i < length - 1; i++) {
            var midX = linePoints[i].x + ((linePoints[i + 1].x - linePoints[i].x) / 2);
            var midY = linePoints[i].y + ((linePoints[i + 1].y - linePoints[i].y) / 2);
            if (!linePoints[i].drag) {
                setPointContextSettings(i);

                context.beginPath();
                context.moveTo(linePoints[i].x, linePoints[i].y);
            }
            context.quadraticCurveTo(linePoints[i].x, linePoints[i].y, midX, midY);
        }
        context.stroke();
    }
}

function saveState() {
    canvasState.unshift(context.getImageData(0, 0, canvas.width, canvas.height));
    linePoints = [];
    if (canvasState.length > 25) canvasState.length = 25;
    undoButton.classList.remove( 'disabled' );
}

function selectTool(e) {
    resetIdleTimer();

    if ( e.target === e.currentTarget ) return;
    if ( !e.target.dataset.action ) highlightButton( e.target );

    tool = e.target.dataset.tool || tool;

    switch(e.target.dataset.action) {
        case 'undo':
            undoState();
            break;
        case 'delete':
            clearCanvas();
            break;
        case 'fill':
            fillCanvas();
            break;
        case 'settings':
            openSettings();
            break;
        default:
            break;
    }
}

function selectColor(e) {
    resetIdleTimer();

    if (e.target === e.currentTarget) return;
    highlightButton(e.target);
    
    toolColor = e.target.dataset.color || toolColor;    

    updateBorderColors();
}

function openSettings() {
    document.querySelector( 'html' ).classList.toggle( 'menu-open' );
}

updateBorderColors();
function updateBorderColors() {
    // Update the active button's color and the fill bucket color
    var buttons = document.querySelectorAll( '#tools img' );
    buttons.forEach( function( element ) { element.style.borderColor = '#ffffff'; } );
    document.querySelector( '#tools img.active' ).style.borderColor = toolColor;
    document.querySelector( '[data-action=\"fill\"]' ).style.borderColor = toolColor;
}

function stop(e) {
    if (e.which === 1 || e.type === 'touchend') {
        resetIdleTimer();

        window.removeEventListener('mousemove', draw);
        window.removeEventListener('touchmove', draw);
    }
}

resizeCanvas();
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    if ( canvasState.length ) updateCanvas();
}

function undoState() {
    context.putImageData( canvasState.shift(), 0, 0 );
    if ( !canvasState.length ) undoButton.classList.add( 'disabled' );
}

function updateCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(canvasState[0], 0, 0);
    renderLine();
}

function fillCanvas() {
    // Save current state of canvas so the fill can be reverted
    saveState();

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Fill the canvas with current color
    context.fillStyle = toolColor;
    context.globalAlpha = '1';
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function getBasicLinePoint(e) {
    var mouseX = e.pageX - canvas.offsetLeft;
    var mouseY = e.pageY - canvas.offsetTop;
    var mouseDrag = e.type === 'mousemove';

    if (e.type === 'touchstart' || e.type === 'touchmove' ) {
        mouseX = e.touches[0].pageX - canvas.offsetLeft;
        mouseY = e.touches[0].pageY - canvas.offsetTop;
        mouseDrag = e.type === 'touchmove';
    }

    return {
        x: mouseX,
        y: mouseY,
        drag: mouseDrag,
        width: toolSize,
        color: toolColor,
        opacity: '1',
        lineCap: 'butt',
        lineJoin: 'miter'
    }
}

// Source: http://perfectionkills.com/exploring-canvas-drawing-techniques/
function getLinePointForPen(e) {
    // Get the default line point settings
    var point = getBasicLinePoint(e);

    // Add the settings of pen to the point
    point.width = getRandomInt(3, 4);
    point.opacity = '0.9';
    
    // Return the point
    return point;
}

function getLinePointForPencil(e) {
    // Get the default line point settings
    var point = getBasicLinePoint(e);

    // Add the settings of pencil to the point
    point.width = '1';
    point.opacity = '0.9';

    // Return the point
    return point;
}

function getLinePointForBrush(e) {
    // Get the default line point settings
    var point = getBasicLinePoint(e);

    // Add the settings of brush to the point
    point.lineCap = 'round';
    point.lineJoin = 'round';

    // Return the point
    return point;
}

// Source: http://perfectionkills.com/exploring-canvas-drawing-techniques/
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateTimer() {
    // Add one minute to the timer
    idleTimer += 1;

    // Check if it is time to clear the timer
    if (idleTimer === clearCanvasTimeout) {
        resetIdleTimer(); // Reset the timer
        if (canvasState.length || linePoints.length)
            clearCanvas(); // Clear the canvas
    }
}

// Helper function to reset the timer
function resetIdleTimer() {
    idleTimer = 0;
}