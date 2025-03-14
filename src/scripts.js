const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const tools = {
    colorPicker: document.getElementById('colorPicker'),
    bgColorPicker: document.getElementById('bgColorPicker'),
    clearButton: document.getElementById('clearCanvas'),
    saveButton: document.getElementById('saveButton'),
    undoButton: document.getElementById('undoButton'),
    redoButton: document.getElementById('redoButton'),
    brushSize: document.getElementById('brushSize'),
    eraserButton: document.getElementById('eraserButton'),
    brushTool: document.getElementById('brushTool'),
    lineTool: document.getElementById('lineTool'),
    rectTool: document.getElementById('rectTool'),
    circleTool: document.getElementById('circleTool'),
    gradientButton: document.getElementById('gradientButton'),
    fullscreenButton: document.getElementById('fullscreenButton'),
    zoomLevel: document.getElementById('zoomLevel'),
    resizeCanvasButton: document.getElementById('resizeCanvasButton'),
    resizeModal: document.getElementById('resizeModal'),
    newWidth: document.getElementById('newWidth'),
    newHeight: document.getElementById('newHeight'),
    confirmResize: document.getElementById('confirmResize'),
    cancelResize: document.getElementById('cancelResize')
};

let state = {
    drawing: false,
    currentColor: tools.colorPicker.value,
    bgColor: tools.bgColorPicker.value,
    brushSize: parseInt(tools.brushSize.value),
    eraserMode: false,
    currentTool: 'brush',
    undoStack: [],
    redoStack: [],
    zoom: 100,
    startX: 0,
    startY: 0,
    snapshot: null,
    canvasWidth: 800,
    canvasHeight: 600
};

canvas.width = state.canvasWidth;
canvas.height = state.canvasHeight;
ctx.fillStyle = state.bgColor;
ctx.fillRect(0, 0, canvas.width, canvas.height);

function getCanvasPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX || e.touches[0].clientX - rect.left) * scaleX,
        y: (e.clientY || e.touches[0].clientY - rect.top) * scaleY
    };
}

function startDrawing(e) {
    e.preventDefault();
    state.drawing = true;
    const pos = getCanvasPosition(e);
    state.startX = pos.x;
    state.startY = pos.y;
    state.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    if(state.currentTool === 'brush' || state.currentTool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
}

function draw(e) {
    if(!state.drawing) return;
    e.preventDefault();
    const pos = getCanvasPosition(e);
    
    ctx.putImageData(state.snapshot, 0, 0);
    
    switch(state.currentTool) {
        case 'brush':
        case 'eraser':
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = state.eraserMode ? state.bgColor : state.currentColor;
            ctx.lineWidth = state.brushSize;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke();
            break;
            
        case 'line':
            ctx.beginPath();
            ctx.moveTo(state.startX, state.startY);
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = state.currentColor;
            ctx.lineWidth = state.brushSize;
            ctx.stroke();
            break;
            
        case 'rectangle':
            ctx.strokeStyle = state.currentColor;
            ctx.lineWidth = state.brushSize;
            ctx.strokeRect(state.startX, state.startY, pos.x - state.startX, pos.y - state.startY);
            break;
            
        case 'circle':
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(pos.x - state.startX, 2) + Math.pow(pos.y - state.startY, 2));
            ctx.arc(state.startX, state.startY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = state.currentColor;
            ctx.lineWidth = state.brushSize;
            ctx.stroke();
            break;
            
        case 'gradient':
            const gradient = ctx.createLinearGradient(state.startX, state.startY, pos.x, pos.y);
            gradient.addColorStop(0, state.currentColor);
            gradient.addColorStop(1, state.bgColor);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
    }
}

function stopDrawing() {
    state.drawing = false;
    saveState();
}

function saveState() {
    state.undoStack.push(canvas.toDataURL());
    state.redoStack = [];
    if(state.undoStack.length > 50) state.undoStack.shift();
}

function loadState(stack) {
    if(stack.length) {
        const img = new Image();
        img.src = stack.pop();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
}

function toggleFullscreen() {
    if(!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function updateTool(tool) {
    document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
    tools[tool + 'Tool'].classList.add('active');
    state.currentTool = tool;
}

tools.colorPicker.addEventListener('input', e => state.currentColor = e.target.value);
tools.bgColorPicker.addEventListener('input', e => {
    state.bgColor = e.target.value;
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
});
tools.brushSize.addEventListener('change', e => state.brushSize = parseInt(e.target.value));
tools.eraserButton.addEventListener('click', () => {
    state.eraserMode = !state.eraserMode;
    tools.eraserButton.classList.toggle('active', state.eraserMode);
});
tools.brushTool.addEventListener('click', () => updateTool('brush'));
tools.lineTool.addEventListener('click', () => updateTool('line'));
tools.rectTool.addEventListener('click', () => updateTool('rectangle'));
tools.circleTool.addEventListener('click', () => updateTool('circle'));
tools.gradientButton.addEventListener('click', () => updateTool('gradient'));
tools.fullscreenButton.addEventListener('click', toggleFullscreen);
tools.zoomLevel.addEventListener('input', e => {
    state.zoom = e.target.value;
    canvas.style.transform = `scale(${state.zoom / 100})`;
});
tools.resizeCanvasButton.addEventListener('click', () => tools.resizeModal.style.display = 'flex');
tools.confirmResize.addEventListener('click', () => {
    canvas.width = parseInt(tools.newWidth.value) || state.canvasWidth;
    canvas.height = parseInt(tools.newHeight.value) || state.canvasHeight;
    state.canvasWidth = canvas.width;
    state.canvasHeight = canvas.height;
    tools.resizeModal.style.display = 'none';
    saveState();
});
tools.cancelResize.addEventListener('click', () => tools.resizeModal.style.display = 'none');
tools.clearButton.addEventListener('click', () => {
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
});
tools.saveButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
});
tools.undoButton.addEventListener('click', () => loadState(state.undoStack));
tools.redoButton.addEventListener('click', () => loadState(state.redoStack));

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

document.addEventListener('keydown', e => {
    if(e.ctrlKey && e.key === 'z') loadState(state.undoStack);
    if(e.ctrlKey && e.key === 'y') loadState(state.redoStack);
});
